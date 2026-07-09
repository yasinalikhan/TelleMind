package com.telemind.analytics.a2ui;

import java.util.List;
import java.util.Map;

public record A2UIComponent(
    String id,
    String type,
    Map<String, Object> props,
    List<A2UIEvent> events
) {}
