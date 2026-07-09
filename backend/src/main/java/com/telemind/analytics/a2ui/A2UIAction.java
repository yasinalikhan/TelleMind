package com.telemind.analytics.a2ui;

public record A2UIAction(
    String type,
    String target,
    String parameter
) {}
