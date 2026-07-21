package com.telemind.analytics.controller;

import com.telemind.analytics.a2ui.A2UIResponse;
import com.telemind.analytics.a2ui.ResponseBuilderService;
import com.telemind.analytics.ai.VisualizationService;
import com.telemind.analytics.ai.VisualizationService.VisualizationDecision;
import com.telemind.analytics.query.QueryExecutorService;
import com.telemind.analytics.query.SqlGeneratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final SqlGeneratorService sqlGeneratorService;
    private final QueryExecutorService queryExecutorService;
    private final VisualizationService visualizationService;
    private final ResponseBuilderService responseBuilderService;
    private final CacheManager cacheManager;

    public AnalyticsController(SqlGeneratorService sqlGeneratorService,
                               QueryExecutorService queryExecutorService,
                               VisualizationService visualizationService,
                               ResponseBuilderService responseBuilderService,
                               CacheManager cacheManager) {
        this.sqlGeneratorService = sqlGeneratorService;
        this.queryExecutorService = queryExecutorService;
        this.visualizationService = visualizationService;
        this.responseBuilderService = responseBuilderService;
        this.cacheManager = cacheManager;
    }

    @PostMapping("/query")
    public ResponseEntity<?> processQuery(@RequestBody QueryRequest request) {
        try {
            String question = request.query() != null ? request.query() : request.question();
            if (question == null || question.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Query cannot be empty"));
            }
            log.info("Processing natural language query: {}", question);
            long startTime = System.currentTimeMillis();

            // 1. Check cache for generated SQL (key is question)
            String sql = null;
            boolean cacheHit = false;
            Cache cache = cacheManager.getCache("sqlQueries");
            if (cache != null) {
                Cache.ValueWrapper val = cache.get(question);
                if (val != null) {
                    sql = (String) val.get();
                    cacheHit = true;
                    log.info("SQL query cache hit for: '{}'", question);
                }
            }

            if (sql == null) {
                // Generate SQL (LLM or heuristics)
                sql = sqlGeneratorService.generateSql(question);
                log.info("Generated SQL: {}", sql);
                if (cache != null && sql != null) {
                    cache.put(question, sql);
                }
            }

            // 2. Execute SQL query securely
            List<Map<String, Object>> data = queryExecutorService.executeQuery(sql);
            log.info("Query returned {} rows", data.size());

            // 3. Make Visualization Decision
            VisualizationDecision decision = visualizationService.decideVisualization(question, data);
            log.info("Visualization decision: Type={}, Title={}", decision.componentType(), decision.title());

            long endTime = System.currentTimeMillis();
            long latencyMs = endTime - startTime;

            // 4. Build A2UI Response with latency and cache metadata
            Map<String, Object> metadata = Map.of(
                    "latencyMs", latencyMs,
                    "cacheHit", cacheHit,
                    "sql", sql != null ? sql : ""
            );
            A2UIResponse response = responseBuilderService.buildResponse(decision.title(), decision, metadata);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException iae) {
            log.warn("Invalid query request: {}", iae.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (SecurityException se) {
            log.error("Security block on query execution", se);
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception e) {
            log.error("Error processing query", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/drill-down")
    public ResponseEntity<?> processDrillDown(@RequestParam String region) {
        try {
            log.info("Processing drill down details for region: {}", region);
            
            // Query detailed subscriber records for this region using parameterized SQL
            String sql = "SELECT msisdn, region, plan, status, recharge_amount, signup_date FROM subscriber WHERE region = ?";
            List<Map<String, Object>> data = queryExecutorService.executeQuery(sql, region);
            
            // Build visual representation - a table of subscribers
            VisualizationDecision decision = visualizationService.decideVisualization("Show all inactive users", data);
            A2UIResponse response = responseBuilderService.buildResponse("Subscribers in " + region, decision);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing drill down", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    public record QueryRequest(String query, String question) {}
}
