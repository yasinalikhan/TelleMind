package com.telemind.analytics.semantic;

public enum MetricUnit {
    CURRENCY("USD", "$"),
    PERCENTAGE("%", "%"),
    GIGABYTES("GB", "GB"),
    MEGABYTES("MB", "MB"),
    MINUTES("min", "m"),
    HOURS("hrs", "h"),
    COUNT("count", "#"),
    RATIO("ratio", "");

    private final String label;
    private final String symbol;

    MetricUnit(String label, String symbol) {
        this.label = label;
        this.symbol = symbol;
    }

    public String getLabel() {
        return label;
    }

    public String getSymbol() {
        return symbol;
    }
}
