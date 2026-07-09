package com.telemind.analytics.a2ui;

import java.util.List;

public record A2UIPage(
    String title,
    String layout,
    List<A2UIComponent> components
) {}
