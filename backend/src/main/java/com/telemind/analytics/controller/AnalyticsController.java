package com.telemind.analytics.controller;

import com.telemind.analytics.a2ui.A2UIResponse;
import com.telemind.analytics.a2ui.ResponseBuilderService;
import com.telemind.analytics.ai.VisualizationService;
import com.telemind.analytics.ai.VisualizationService.VisualizationDecision;
import com.telemind.analytics.query.QueryExecutorService;
import com.telemind.analytics.query.SqlGeneratorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public AnalyticsController(SqlGeneratorService sqlGeneratorService,
                               QueryExecutorService queryExecutorService,
                               VisualizationService visualizationService,
                               ResponseBuilderService responseBuilderService) {
        this.sqlGeneratorService = sqlGeneratorService;
        this.queryExecutorService = queryExecutorService;
        this.visualizationService = visualizationService;
        this.responseBuilderService = responseBuilderService;
    }

    @PostMapping("/query")
    public ResponseEntity<?> processQuery(@RequestBody QueryRequest request) {
        try {
            String question = request.query();
            log.info("Processing natural language query: {}", question);

            // 1. Generate SQL
            String sql = sqlGeneratorService.generateSql(question);
            log.info("Generated SQL: {}", sql);

            // 2. Execute SQL query securely
            List<Map<String, Object>> data = queryExecutorService.executeQuery(sql);
            log.info("Query returned {} rows", data.size());

            // 3. Make Visualization Decision
            VisualizationDecision decision = visualizationService.decideVisualization(question, data);
            log.info("Visualization decision: Type={}, Title={}", decision.componentType(), decision.title());

            // 4. Build A2UI Response
            A2UIResponse response = responseBuilderService.buildResponse(decision.title(), decision);

            return ResponseEntity.ok(response);
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
            
            // Query detailed subscriber records for this region
            String sql = "SELECT msisdn, region, plan, status, recharge_amount, signup_date FROM subscriber WHERE region = '" + region.replace("'", "''") + "'";
            List<Map<String, Object>> data = queryExecutorService.executeQuery(sql);
            
            // Build visual representation - a table of subscribers
            VisualizationDecision decision = visualizationService.decideVisualization("Show all inactive users", data);
            A2UIResponse response = responseBuilderService.buildResponse("Subscribers in " + region, decision);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing drill down", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    public record QueryRequest(String query) {}
}
