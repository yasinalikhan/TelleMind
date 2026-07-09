package com.telemind.analytics.a2ui;

public record A2UIEvent(
    String event,
    A2UIAction action
) {}
