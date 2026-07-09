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

@Service
public class SqlGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(SqlGeneratorService.class);

    private final HttpClient httpClient;

    @Value("${openai.api.key:}")
    private String apiKey;

    // Default points to Ollama running on the host
    @Value("${openai.api.url:http://localhost:11434/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.model:llama3}")
    private String model;

    public SqlGeneratorService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public String generateSql(String question) {
        // Try Ollama/AI if configured (non-empty api key field, or Ollama doesn't need one)
        if (apiUrl != null && apiUrl.contains("11434")) {
            // Ollama — always try AI path
            try {
                log.info("Generating SQL using local Ollama ({}): {}", model, apiUrl);
                return generateSqlWithAi(question);
            } catch (Exception e) {
                log.warn("Ollama SQL generation failed ({}), falling back to heuristics: {}", e.getClass().getSimpleName(), e.getMessage());
            }
        } else if (apiKey != null && !apiKey.trim().isEmpty()) {
            // OpenAI-compatible external API
            try {
                log.info("Generating SQL using external AI API: {}", apiUrl);
                return generateSqlWithAi(question);
            } catch (Exception e) {
                log.warn("AI SQL generation failed, falling back to heuristics: {}", e.getMessage());
            }
        } else {
            log.info("No AI configured. Using local Heuristics Engine.");
        }

        return generateSqlWithHeuristics(question);
    }

    private String generateSqlWithAi(String question) throws Exception {
        String systemMessage = "You are a PostgreSQL SQL expert for a telecom analytics platform. " +
                "Translate natural language into a single, valid PostgreSQL SELECT query only. " +
                "\n\nEXACT DATABASE SCHEMA (column types matter):\n" +
                "  subscriber (id BIGSERIAL PK, msisdn VARCHAR, region VARCHAR, plan VARCHAR, status VARCHAR, recharge_amount NUMERIC, signup_date DATE, tenant_id VARCHAR)\n" +
                "  revenue    (id BIGSERIAL PK, date DATE, region VARCHAR, amount NUMERIC, category VARCHAR, tenant_id VARCHAR)\n" +
                "  usage      (id BIGSERIAL PK, tower VARCHAR, region VARCHAR, data_mb NUMERIC, voice_minutes INT, timestamp TIMESTAMP, tenant_id VARCHAR)\n" +
                "\nCRITICAL RULES:\n" +
                "1. NEVER JOIN subscriber.id (BIGINT) with usage.tenant_id (VARCHAR) — they are INCOMPATIBLE types.\n" +
                "2. The tables are INDEPENDENT — each has its own tenant_id. Do NOT join them unless the question explicitly asks for a cross-table query.\n" +
                "3. For 'data usage by region': SELECT region, SUM(data_mb) AS data_mb FROM usage GROUP BY region ORDER BY data_mb DESC\n" +
                "4. For 'revenue trend': SELECT date, SUM(amount) AS amount FROM revenue GROUP BY date ORDER BY date\n" +
                "5. Use CURRENT_DATE for today. Date math: CURRENT_DATE - INTERVAL '30 days'. Never use TODAY() or DATEADD.\n" +
                "6. Return ONLY the raw SQL — no markdown, no explanation, no code fences, no semicolon at end.\n" +
                "7. Do NOT add WHERE tenant_id = ... — it is appended automatically.\n" +
                "\nEXAMPLES:\n" +
                "Q: Show data usage by region → SELECT region, SUM(data_mb) AS data_mb, SUM(voice_minutes) AS voice_minutes FROM usage GROUP BY region ORDER BY data_mb DESC\n" +
                "Q: Revenue last 30 days → SELECT date, SUM(amount) AS amount FROM revenue WHERE date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY date ORDER BY date\n" +
                "Q: Top 10 subscribers by recharge → SELECT msisdn, region, recharge_amount FROM subscriber ORDER BY recharge_amount DESC LIMIT 10\n" +
                "Q: Inactive subscribers → SELECT msisdn, region, plan, status FROM subscriber WHERE status = 'Inactive'";

        // Build JSON payload — escape for embedding in JSON string
        String escapedSystem = systemMessage.replace("\"", "\\\"").replace("\n", "\\n");
        String escapedQuestion = question.replace("\"", "\\\"");

        String payload = """
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "%s"},
                    {"role": "user", "content": "%s"}
                  ],
                  "temperature": 0.0,
                  "stream": false
                }
                """.formatted(model, escapedSystem, escapedQuestion);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .timeout(Duration.ofSeconds(180)); // Ollama cold-start can take 2-3 min on first load

        // Add Authorization only if API key is provided (not needed for Ollama)
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            builder.header("Authorization", "Bearer " + apiKey);
        }

        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        log.debug("AI response status: {}", response.statusCode());

        if (response.statusCode() == 200) {
            String body = response.body();
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(body);
                com.fasterxml.jackson.databind.JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    com.fasterxml.jackson.databind.JsonNode message = choices.get(0).path("message");
                    com.fasterxml.jackson.databind.JsonNode content = message.path("content");
                    if (!content.isMissingNode() && content.isTextual()) {
                        String sql = content.asText()
                                .replace("```sql", "")
                                .replace("```", "")
                                .trim();
                        log.info("AI generated SQL: {}", sql);
                        return sql;
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse AI JSON response", e);
            }
        }
        throw new RuntimeException("AI API error: HTTP " + response.statusCode() + " → " + response.body().substring(0, Math.min(200, response.body().length())));
    }

    private String generateSqlWithHeuristics(String question) {
        String q = question.toLowerCase().trim();
        log.info("Using heuristics engine for: {}", question);

        // 1. Total Revenue
        if (q.contains("total revenue") || q.contains("how much revenue")) {
            return "SELECT SUM(amount) AS total_revenue FROM revenue";
        }

        // 2. Revenue Trend — PostgreSQL date arithmetic
        if (q.contains("revenue trend") || q.contains("daily revenue")) {
            if (q.contains("30 days") || q.contains("last month")) {
                return "SELECT date, SUM(amount) AS amount FROM revenue WHERE date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY date ORDER BY date";
            }
            if (q.contains("7 days") || q.contains("week")) {
                return "SELECT date, SUM(amount) AS amount FROM revenue WHERE date >= CURRENT_DATE - INTERVAL '7 days' GROUP BY date ORDER BY date";
            }
            return "SELECT date, SUM(amount) AS amount FROM revenue GROUP BY date ORDER BY date";
        }

        // 3. Revenue by region
        if (q.contains("revenue by region") || q.contains("compare revenue")) {
            return "SELECT region, SUM(amount) AS amount FROM revenue GROUP BY region ORDER BY amount DESC";
        }

        // 4. Subscriber distribution by plan
        if (q.contains("by plan") || q.contains("subscriber distribution") || q.contains("subscriber count by plan")) {
            return "SELECT plan, COUNT(*) AS count FROM subscriber GROUP BY plan ORDER BY count DESC";
        }

        // 5. Traffic heatmap
        if (q.contains("heatmap") || q.contains("traffic by tower") || q.contains("network traffic by tower")) {
            return "SELECT region, tower, SUM(data_mb) AS data_mb FROM usage GROUP BY region, tower ORDER BY data_mb DESC";
        }

        // 6. Subscriber by province/region (Geo map)
        if ((q.contains("by region") || q.contains("by province")) && q.contains("subscriber")) {
            return "SELECT region AS province, COUNT(*) AS count FROM subscriber GROUP BY region ORDER BY count DESC";
        }

        // 7. Inactive subscribers
        if (q.contains("inactive subscriber") || q.contains("inactive user") || q.contains("show all inactive")) {
            return "SELECT msisdn, region, plan, recharge_amount, signup_date FROM subscriber WHERE status = 'Inactive'";
        }

        // 8. Active subscribers
        if (q.contains("active subscriber") || q.contains("active user")) {
            return "SELECT COUNT(*) AS active_subscribers FROM subscriber WHERE status = 'Active'";
        }

        // 9. Network usage on map / by region
        if (q.contains("usage on map") || q.contains("network usage by region") || q.contains("usage by region") || q.contains("display network usage")) {
            return "SELECT region, SUM(data_mb) AS data_mb, SUM(voice_minutes) AS voice_minutes FROM usage GROUP BY region ORDER BY data_mb DESC";
        }

        // 10. Top subscribers by recharge
        if (q.contains("top") && q.contains("subscriber") && (q.contains("recharge") || q.contains("amount"))) {
            return "SELECT msisdn, region, recharge_amount FROM subscriber ORDER BY recharge_amount DESC LIMIT 10";
        }

        // 11. Compare data usage by region
        if (q.contains("compare data usage") || q.contains("data usage by region")) {
            return "SELECT region, SUM(data_mb) AS data_mb FROM usage GROUP BY region ORDER BY data_mb DESC";
        }

        // Fallback
        log.warn("Heuristics could not match: '{}'. Using default subscriber query.", question);
        return "SELECT msisdn, region, plan, status, recharge_amount FROM subscriber ORDER BY recharge_amount DESC";
    }
}
