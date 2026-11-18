package com.telemind.analytics.autonomous;

import java.util.Map;

public record ActionExecutionRecord(
        String executionId,
        String anomalyId,
        String actionType,
        String actionLabel,
        String target,
        String status, // COMPLETED, DISPATCHED, ACTIVE
        String operatorTenant,
        String triggeredBy,
        String timestamp,
        String resultSummary,
        Map<String, Object> outputMetadata
) {}
