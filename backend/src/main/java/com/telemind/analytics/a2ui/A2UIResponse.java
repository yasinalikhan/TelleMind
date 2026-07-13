package com.telemind.analytics.a2ui;

import java.util.List;
import java.util.Map;

public record A2UIResponse(
    String version,
    A2UIPage page,
    List<A2UIAction> actions,
    Map<String, Object> metadata
) {}
