package com.telemind.analytics.autonomous;

import java.util.Map;

public record TelcoActionOption(
        String actionId,
        String actionType,
        String label,
        String description,
        String buttonStyle,
        Map<String, Object> payload
) {}
