package com.telemind.analytics.semantic;

import java.util.List;

public record MetricDefinition(
        String id,
        String displayName,
        MetricCategory category,
        String description,
        String sqlFormula,
        String baseTable,
        List<String> compatibleDimensions,
        MetricUnit unit,
        Double targetBenchmark,
        List<String> keywords
) {}
