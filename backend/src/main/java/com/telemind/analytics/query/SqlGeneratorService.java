package com.telemind.analytics.query;

import com.telemind.analytics.model.CustomDataset;
import com.telemind.analytics.repository.CustomDatasetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class SqlGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(SqlGeneratorService.class);

    private final HttpClient httpClient;
    private final CustomDatasetRepository customDatasetRepository;

    @Value("${openai.api.key:}")
    private String apiKey;

    // Default points to Ollama running on the host
    @Value("${openai.api.url:http://localhost:11434/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.model:llama3}")
    private String model;

    public SqlGeneratorService(CustomDatasetRepository customDatasetRepository) {
        this.customDatasetRepository = customDatasetRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public String generateSql(String question) {
        String tenantId = com.telemind.analytics.security.TenantContext.getCurrentTenant();
        validateCustomDatasetReference(question, tenantId);

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
        String tenantId = com.telemind.analytics.security.TenantContext.getCurrentTenant();
        StringBuilder customSchemaPrompt = new StringBuilder();
        if (tenantId != null) {
            try {
                List<CustomDataset> datasets = customDatasetRepository.findByTenantId(tenantId);
                for (CustomDataset ds : datasets) {
                    String schemaJson = ds.getSchemaJson();
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    Map<String, String> columns = mapper.readValue(schemaJson, Map.class);
                    String fullTableName = "ds_" + tenantId.replace("-", "_") + "_" + ds.getTableName();
                    customSchemaPrompt.append("  ").append(fullTableName).append(" (id SERIAL PK, ");
                    for (Map.Entry<String, String> entry : columns.entrySet()) {
                        customSchemaPrompt.append(entry.getKey()).append(" ").append(entry.getValue()).append(", ");
                    }
                    customSchemaPrompt.append("tenant_id VARCHAR)\n");
                }
            } catch (Exception e) {
                log.error("Failed to build custom schema prompt", e);
            }
        }

        String systemMessage = "You are a PostgreSQL SQL expert for a telecom analytics platform. " +
                "Translate natural language into a single, valid PostgreSQL SELECT query only. " +
                "\n\nEXACT DATABASE SCHEMA (column types matter):\n" +
                "  subscriber (id BIGSERIAL PK, msisdn VARCHAR, region VARCHAR, plan VARCHAR, status VARCHAR, recharge_amount NUMERIC, signup_date DATE, tenant_id VARCHAR)\n" +
                "  revenue    (id BIGSERIAL PK, date DATE, region VARCHAR, amount NUMERIC, category VARCHAR, tenant_id VARCHAR)\n" +
                "  usage      (id BIGSERIAL PK, tower VARCHAR, region VARCHAR, data_mb NUMERIC, voice_minutes INT, timestamp TIMESTAMP, tenant_id VARCHAR)\n" +
                customSchemaPrompt.toString() +
                "\nCRITICAL RULES:\n" +
                "1. NEVER JOIN subscriber.id (BIGINT) with usage.tenant_id (VARCHAR) — they are INCOMPATIBLE types.\n" +
                "2. The tables are INDEPENDENT — each has its own tenant_id. Do NOT join them unless the question explicitly asks for a cross-table query.\n" +
                "3. For 'data usage by region': SELECT region, SUM(data_mb) AS data_mb FROM usage GROUP BY region ORDER BY data_mb DESC\n" +
                "4. For 'revenue trend': SELECT date, SUM(amount) AS amount FROM revenue GROUP BY date ORDER BY date\n" +
                "5. Use CURRENT_DATE for today. Date math: CURRENT_DATE - INTERVAL '30 days'. Never use TODAY() or DATEADD.\n" +
                "6. Return ONLY the raw SQL — no markdown, no explanation, no code fences, no semicolons.\n" +
                "7. NEVER use placeholder text like <tenant_id>, {tenant_id}, or :tenant_id — omit WHERE tenant_id entirely; it is injected automatically.\n" +
                "8. If the user refers to a custom dataset name (e.g. 'sales_data'), write the SQL query targeting its dynamic table name (e.g. 'ds_" + (tenantId != null ? tenantId.replace("-", "_") : "tenant_id") + "_sales_data').\n" +
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
                                .trim()
                                .replaceAll(";\\s*$", ""); // JDBC rejects trailing semicolons

                        // Sanity check — must be a SELECT statement
                        if (!sql.toLowerCase().startsWith("select")) {
                            log.warn("AI returned non-SELECT response, falling back to heuristics. Got: {}", sql.substring(0, Math.min(120, sql.length())));
                            throw new RuntimeException("AI response is not a valid SELECT query");
                        }

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

        // Heuristics fallback for custom tables
        String tenantId = com.telemind.analytics.security.TenantContext.getCurrentTenant();
        if (tenantId != null) {
            try {
                List<CustomDataset> datasets = customDatasetRepository.findByTenantId(tenantId);
                for (CustomDataset ds : datasets) {
                    String cleanName = ds.getTableName().toLowerCase();
                    if (q.contains(cleanName) || q.contains(cleanName.replace("_", " "))) {
                        String fullTableName = "ds_" + tenantId.replace("-", "_") + "_" + ds.getTableName();
                        String schemaJson = ds.getSchemaJson();
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        Map<String, String> columns = mapper.readValue(schemaJson, Map.class);

                        String dateCol = null;
                        String numCol = null;
                        String labelCol = null;
                        for (Map.Entry<String, String> entry : columns.entrySet()) {
                            String colName = entry.getKey();
                            String colType = entry.getValue();
                            if (colType.equals("DATE") && dateCol == null) {
                                dateCol = colName;
                            } else if ((colType.equals("NUMERIC") || colType.equals("INTEGER")) && numCol == null) {
                                numCol = colName;
                            } else if (colType.equals("VARCHAR(255)") && labelCol == null) {
                                labelCol = colName;
                            }
                        }

                        if (q.contains("trend") && dateCol != null && numCol != null) {
                            return "SELECT " + dateCol + ", SUM(" + numCol + ") AS " + numCol + " FROM " + fullTableName + " GROUP BY " + dateCol + " ORDER BY " + dateCol;
                        }
                        if ((q.contains("by") || q.contains("compare")) && labelCol != null && numCol != null) {
                            return "SELECT " + labelCol + ", SUM(" + numCol + ") AS " + numCol + " FROM " + fullTableName + " GROUP BY " + labelCol + " ORDER BY " + numCol + " DESC";
                        }
                        return "SELECT * FROM " + fullTableName + " LIMIT 50";
                    }
                }
            } catch (Exception e) {
                log.warn("Heuristic custom dataset matching failed", e);
            }
        }

        // Fallback
        log.warn("Heuristics could not match: '{}'. Using default subscriber query.", question);
        return "SELECT msisdn, region, plan, status, recharge_amount FROM subscriber ORDER BY recharge_amount DESC";
    }

    private void validateCustomDatasetReference(String question, String tenantId) {
        if (tenantId == null) return;
        String q = question.toLowerCase();

        // 1. Find if the query has words after "from", "join", "table", "dataset", "into"
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
            "\\b(from|join|table|dataset|into)\\s+([a-zA-Z0-9_\\.]+)\\b"
        );
        java.util.regex.Matcher matcher = pattern.matcher(q);
        List<CustomDataset> datasets = customDatasetRepository.findByTenantId(tenantId);
        java.util.Set<String> existingTables = new java.util.HashSet<>();
        for (CustomDataset ds : datasets) {
            existingTables.add(ds.getTableName().toLowerCase());
        }

        while (matcher.find()) {
            String tableName = matcher.group(2).toLowerCase();
            // Remove file extensions
            if (tableName.endsWith(".csv") || tableName.endsWith(".xlsx")) {
                tableName = tableName.substring(0, tableName.lastIndexOf('.'));
            }
            // Skip standard tables and common SQL keywords / noise words
            if (tableName.equals("subscriber") || tableName.equals("revenue") || tableName.equals("usage") ||
                tableName.equals("select") || tableName.equals("where") || tableName.equals("dual") ||
                tableName.equals("the") || tableName.equals("a") || tableName.equals("an")) {
                continue;
            }
            // If the table name referenced is not registered, fail fast!
            if (!existingTables.contains(tableName)) {
                throw new IllegalArgumentException("Dataset table '" + tableName + "' does not exist or has not been uploaded yet.");
            }
        }

        // 2. Also check for standalone words with underscores or files
        String[] words = q.split("\\s+");
        for (String word : words) {
            // Remove punctuation
            word = word.replaceAll("[^a-zA-Z0-9_\\.]", "");
            if (word.endsWith(".csv") || word.endsWith(".xlsx")) {
                String base = word.substring(0, word.lastIndexOf('.'));
                if (!existingTables.contains(base)) {
                    throw new IllegalArgumentException("Dataset '" + word + "' has not been uploaded yet.");
                }
            } else if (word.contains("_") && !word.startsWith("_") && !word.endsWith("_")) {
                // If it contains underscore, e.g., test_sales, check if it's an existing table
                if (!word.equals("tenant_id") && !existingTables.contains(word)) {
                    throw new IllegalArgumentException("Custom dataset table '" + word + "' does not exist or has not been uploaded yet.");
                }
            }
        }
    }
}
