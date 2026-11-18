package com.telemind.analytics.autonomous;

import java.util.List;

public record TelcoAnomaly(
        String id,
        String metricId,
        String title,
        String severity, // CRITICAL, WARNING, INFO
        String region,
        String tower,
        double baselineValue,
        double anomalyValue,
        double deviationPercent,
        String detectedAt,
        String rootCauseAnalysis,
        List<String> evidencePoints,
        List<TelcoActionOption> recommendedActions,
        String status // OPEN, ACTION_TAKEN, RESOLVED
) {}
