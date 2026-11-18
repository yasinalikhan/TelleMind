package com.telemind.analytics.controller;

import com.telemind.analytics.a2ui.A2UIResponse;
import com.telemind.analytics.a2ui.ResponseBuilderService;
import com.telemind.analytics.ai.VisualizationService;
import com.telemind.analytics.ai.VisualizationService.VisualizationDecision;
import com.telemind.analytics.query.QueryExecutorService;
import com.telemind.analytics.semantic.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/semantic")
public class SemanticController {

    private static final Logger log = LoggerFactory.getLogger(SemanticController.class);

    private final SemanticCatalogService semanticCatalogService;
    private final QueryExecutorService queryExecutorService;
    private final VisualizationService visualizationService;
    private final ResponseBuilderService responseBuilderService;
    private final InMemoryOlapEngine inMemoryOlapEngine;

    @Autowired
    public SemanticController(
            SemanticCatalogService semanticCatalogService,
            QueryExecutorService queryExecutorService,
            VisualizationService visualizationService,
            ResponseBuilderService responseBuilderService,
            InMemoryOlapEngine inMemoryOlapEngine) {
        this.semanticCatalogService = semanticCatalogService;
        this.queryExecutorService = queryExecutorService;
        this.visualizationService = visualizationService;
        this.responseBuilderService = responseBuilderService;
        this.inMemoryOlapEngine = inMemoryOlapEngine;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Collection<MetricDefinition>> getMetrics() {
        return ResponseEntity.ok(semanticCatalogService.getAllMetrics());
    }

    @GetMapping("/dimensions")
    public ResponseEntity<Collection<DimensionDefinition>> getDimensions() {
        return ResponseEntity.ok(semanticCatalogService.getAllDimensions());
    }

    public record MetricExecutionRequest(String metricId, String dimension) {}

    @PostMapping("/query")
    public ResponseEntity<?> executeMetricQuery(@RequestBody MetricExecutionRequest request) {
        if (request.metricId() == null || request.metricId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Metric ID is required"));
        }

        Optional<MetricDefinition> metricOpt = semanticCatalogService.getMetric(request.metricId());
        if (metricOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unknown metric: " + request.metricId()));
        }

        MetricDefinition metric = metricOpt.get();
        String dimension = request.dimension();

        String sql;
        String questionTitle;
        if (dimension != null && !dimension.isBlank()) {
            sql = String.format("SELECT %s, %s AS %s FROM %s GROUP BY %s ORDER BY %s DESC",
                    dimension, metric.sqlFormula(), metric.id(), metric.baseTable(), dimension, metric.id());
            questionTitle = metric.displayName() + " by " + dimension;
        } else {
            sql = String.format("SELECT %s AS %s FROM %s", metric.sqlFormula(), metric.id(), metric.baseTable());
            questionTitle = metric.displayName();
        }

        try {
            long start = System.currentTimeMillis();
            List<Map<String, Object>> data = queryExecutorService.executeQuery(sql);
            long latencyMs = System.currentTimeMillis() - start;

            VisualizationDecision decision = visualizationService.decideVisualization(questionTitle, data);
            Map<String, Object> metadata = Map.of(
                    "metricId", metric.id(),
                    "unit", metric.unit().getSymbol(),
                    "category", metric.category().name(),
                    "sql", sql,
                    "latencyMs", latencyMs
            );

            A2UIResponse response = responseBuilderService.buildResponse(questionTitle, decision, metadata);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to execute semantic metric query", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    public record OlapRequest(
            String tableName,
            String measureCol,
            String aggFunc,
            String groupByCol,
            String filterCol,
            String filterVal
    ) {}

    @PostMapping("/olap-query")
    public ResponseEntity<?> executeOlapQuery(@RequestBody OlapRequest request) {
        if (request.tableName() == null || request.measureCol() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "tableName and measureCol are required"));
        }

        InMemoryOlapEngine.AggFunction func = InMemoryOlapEngine.AggFunction.SUM;
        if (request.aggFunc() != null) {
            try {
                func = InMemoryOlapEngine.AggFunction.valueOf(request.aggFunc().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Default to SUM
            }
        }

        long start = System.nanoTime();
        List<Map<String, Object>> result = inMemoryOlapEngine.aggregate(
                request.tableName(),
                request.measureCol(),
                func,
                request.groupByCol(),
                request.filterCol(),
                request.filterVal()
        );
        long durationUs = (System.nanoTime() - start) / 1000;

        return ResponseEntity.ok(Map.of(
                "data", result,
                "rowCount", result.size(),
                "executionTimeUs", durationUs,
                "executionTimeMs", durationUs / 1000.0,
                "engine", "Vectorized In-Memory Columnar OLAP"
        ));
    }
}
