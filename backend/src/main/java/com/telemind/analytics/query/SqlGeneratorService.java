package com.telemind.analytics.query;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Pattern;

@Service
public class SqlGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(SqlGeneratorService.class);

    private final HttpClient httpClient;
    
    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.api.model:gpt-4o}")
    private String model;

    public SqlGeneratorService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String generateSql(String question) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                log.info("Generating SQL using OpenAI-compatible API: {}", apiUrl);
                return generateSqlWithAi(question);
            } catch (Exception e) {
                log.error("AI SQL generation failed, falling back to heuristics", e);
            }
        } else {
            log.info("No API key configured. Using local Heuristics Engine.");
        }

        return generateSqlWithHeuristics(question);
    }

    private String generateSqlWithAi(String question) throws Exception {
        String systemMessage = "You are a Spring Boot H2 SQL expert. Translate natural language into single SELECT SQL queries. Schema:\n" +
                "- subscriber (id, msisdn, region, plan, status, recharge_amount, signup_date, tenant_id)\n" +
                "- revenue (id, date, region, amount, category, tenant_id)\n" +
                "- usage (id, tower, region, data_mb, voice_minutes, timestamp, tenant_id)\n\n" +
                "Return raw SQL only. No formatting, no markdown, no comments, no explanation.";

        String payload = """
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "%s"},
                    {"role": "user", "content": "%s"}
                  ],
                  "temperature": 0.0
                }
                """.formatted(model, systemMessage.replace("\n", "\\n").replace("\"", "\\\""), question.replace("\"", "\\\""));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            String body = response.body();
            // Simple parsing to extract content from openai chat completion JSON structure
            int contentIdx = body.indexOf("\"content\":");
            if (contentIdx != -1) {
                int startQuote = body.indexOf("\"", contentIdx + 10);
                int endQuote = body.indexOf("\"", startQuote + 1);
                String sql = body.substring(startQuote + 1, endQuote)
                        .replace("\\n", " ")
                        .replace("\\\"", "\"")
                        .replace("```sql", "")
                        .replace("```", "")
                        .trim();
                log.debug("Extracted AI SQL: {}", sql);
                return sql;
            }
        }
        throw new RuntimeException("API error: Status code " + response.statusCode() + " response: " + response.body());
    }

    private String generateSqlWithHeuristics(String question) {
        String q = question.toLowerCase().trim();

        // 1. Total Revenue / Show Revenue
        if (q.contains("total revenue") || q.equals("show total revenue") || q.contains("how much revenue")) {
            return "SELECT SUM(amount) AS total_revenue FROM revenue";
        }

        // 2. Revenue Trend
        if (q.contains("revenue trend") || q.contains("daily revenue")) {
            if (q.contains("30 days")) {
                return "SELECT date, SUM(amount) AS amount FROM revenue WHERE date >= DATEADD('DAY', -30, CURRENT_DATE) GROUP BY date ORDER BY date";
            }
            return "SELECT date, SUM(amount) AS amount FROM revenue GROUP BY date ORDER BY date";
        }

        // 3. Compare revenue by region
        if (q.contains("revenue by region") || q.contains("compare revenue by region")) {
            return "SELECT region, SUM(amount) AS amount FROM revenue GROUP BY region ORDER BY amount DESC";
        }

        // 4. Subscriber distribution by plan
        if (q.contains("subscriber distribution") || q.contains("by plan") || q.contains("subscriber count by plan")) {
            return "SELECT plan, COUNT(*) AS count FROM subscriber GROUP BY plan";
        }

        // 5. Traffic heatmap / Network usage by tower
        if (q.contains("traffic heatmap") || q.contains("network traffic by tower") || q.contains("traffic by tower")) {
            return "SELECT region, tower, SUM(data_mb) AS data_mb FROM usage GROUP BY region, tower ORDER BY data_mb DESC";
        }

        // 6. Subscriber count by province/region (Geo map)
        if (q.contains("by province") || q.contains("by region") && q.contains("subscriber")) {
            return "SELECT region AS province, COUNT(*) AS count FROM subscriber GROUP BY region ORDER BY count DESC";
        }

        // 7. Inactive users
        if (q.contains("inactive subscribers") || q.contains("inactive users") || q.contains("show all inactive")) {
            return "SELECT msisdn, region, plan, recharge_amount, signup_date FROM subscriber WHERE status = 'Inactive'";
        }

        // 8. Active subscribers count
        if (q.contains("active subscribers") || q.contains("active users")) {
            return "SELECT COUNT(*) AS active_subscribers FROM subscriber WHERE status = 'Active'";
        }

        // 9. Display network usage on map / usage by region
        if (q.contains("usage on map") || q.contains("network usage by region") || q.contains("usage by region")) {
            return "SELECT region, SUM(data_mb) AS data_mb, SUM(voice_minutes) AS voice_minutes FROM usage GROUP BY region";
        }

        // 10. Top subscribers by recharge
        if (q.contains("top") && q.contains("subscriber") && (q.contains("recharge") || q.contains("amount"))) {
            return "SELECT msisdn, region, recharge_amount FROM subscriber ORDER BY recharge_amount DESC LIMIT 10";
        }

        // Fallback generic SELECT
        log.warn("Heuristic SQL generator could not match question. Returning default subscriber select.");
        return "SELECT msisdn, region, plan, status FROM subscriber";
    }
}
