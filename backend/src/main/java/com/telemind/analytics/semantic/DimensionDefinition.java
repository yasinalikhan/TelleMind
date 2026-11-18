package com.telemind.analytics.semantic;

import java.util.List;

public record DimensionDefinition(
        String name,
        String displayName,
        String column,
        String table,
        DimensionType type,
        List<String> sampleValues
) {
    public enum DimensionType {
        GEOGRAPHIC,
        TEMPORAL,
        CATEGORICAL,
        NUMERIC_BIN
    }
}
