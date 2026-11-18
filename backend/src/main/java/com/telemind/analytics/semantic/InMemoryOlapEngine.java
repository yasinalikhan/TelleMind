package com.telemind.analytics.semantic;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-Speed In-Memory Columnar OLAP Engine for Instant CSV & Telemetry Analytics.
 * Employs vectorized columnar vectors (double[], String[]) to execute sub-millisecond
 * aggregations, groupings, and filter operations without database disk roundtrips.
 */
@Service
public class InMemoryOlapEngine {

    private static final Logger log = LoggerFactory.getLogger(InMemoryOlapEngine.class);

    public enum AggFunction {
        SUM, AVG, COUNT, MIN, MAX
    }

    public static class ColumnarTable {
        private final String name;
        private final int rowCount;
        private final Map<String, double[]> numericCols = new ConcurrentHashMap<>();
        private final Map<String, String[]> stringCols = new ConcurrentHashMap<>();

        public ColumnarTable(String name, int rowCount) {
            this.name = name;
            this.rowCount = rowCount;
        }

        public void putNumeric(String col, double[] data) {
            numericCols.put(col.toLowerCase(), data);
        }

        public void putString(String col, String[] data) {
            stringCols.put(col.toLowerCase(), data);
        }

        public int getRowCount() {
            return rowCount;
        }

        public Set<String> getColumns() {
            Set<String> all = new HashSet<>(numericCols.keySet());
            all.addAll(stringCols.keySet());
            return all;
        }
    }

    private final Map<String, ColumnarTable> datasetStore = new ConcurrentHashMap<>();

    /**
     * Ingest tabular raw records into columnar format for high-speed OLAP.
     */
    public void ingestTable(String tableName, List<String> headers, List<List<String>> rows) {
        if (rows == null || rows.isEmpty() || headers == null || headers.isEmpty()) {
            return;
        }

        int rowCount = rows.size();
        ColumnarTable table = new ColumnarTable(tableName, rowCount);

        for (int colIdx = 0; colIdx < headers.size(); colIdx++) {
            String colName = headers.get(colIdx).trim();
            boolean isNumeric = true;

            // Probe first 50 rows for numeric type
            int probeLimit = Math.min(rowCount, 50);
            for (int r = 0; r < probeLimit; r++) {
                String val = rows.get(r).size() > colIdx ? rows.get(r).get(colIdx) : "";
                if (val != null && !val.trim().isEmpty()) {
                    try {
                        Double.parseDouble(val.trim());
                    } catch (NumberFormatException e) {
                        isNumeric = false;
                        break;
                    }
                }
            }

            if (isNumeric) {
                double[] vec = new double[rowCount];
                for (int r = 0; r < rowCount; r++) {
                    String val = rows.get(r).size() > colIdx ? rows.get(r).get(colIdx) : "0";
                    try {
                        vec[r] = (val != null && !val.trim().isEmpty()) ? Double.parseDouble(val.trim()) : 0.0;
                    } catch (NumberFormatException e) {
                        vec[r] = 0.0;
                    }
                }
                table.putNumeric(colName, vec);
            } else {
                String[] vec = new String[rowCount];
                for (int r = 0; r < rowCount; r++) {
                    String val = rows.get(r).size() > colIdx ? rows.get(r).get(colIdx) : "";
                    vec[r] = val != null ? val.trim() : "";
                }
                table.putString(colName, vec);
            }
        }

        datasetStore.put(tableName.toLowerCase(), table);
        log.info("OLAP Engine ingested table '{}' ({} rows, {} columns)", tableName, rowCount, headers.size());
    }

    /**
     * Executes vectorized aggregation with optional group-by in sub-milliseconds.
     */
    public List<Map<String, Object>> aggregate(
            String tableName,
            String measureCol,
            AggFunction aggFunc,
            String groupByCol,
            String filterCol,
            String filterVal) {

        ColumnarTable table = datasetStore.get(tableName.toLowerCase());
        if (table == null) {
            log.warn("Table '{}' not found in OLAP in-memory store", tableName);
            return Collections.emptyList();
        }

        int rowCount = table.getRowCount();
        double[] measureVec = table.numericCols.get(measureCol.toLowerCase());
        String[] groupVec = (groupByCol != null) ? table.stringCols.get(groupByCol.toLowerCase()) : null;
        String[] filterVec = (filterCol != null) ? table.stringCols.get(filterCol.toLowerCase()) : null;

        if (measureVec == null && aggFunc != AggFunction.COUNT) {
            log.warn("Measure column '{}' is not numeric for aggregation {}", measureCol, aggFunc);
            return Collections.emptyList();
        }

        long startTime = System.nanoTime();

        // Accumulators for Group By
        Map<String, Double> sumMap = new HashMap<>();
        Map<String, Integer> countMap = new HashMap<>();
        Map<String, Double> minMap = new HashMap<>();
        Map<String, Double> maxMap = new HashMap<>();

        // Vectorized Scan Loop
        for (int i = 0; i < rowCount; i++) {
            // Apply filter if specified
            if (filterVec != null && filterVal != null) {
                if (!filterVal.equalsIgnoreCase(filterVec[i])) {
                    continue;
                }
            }

            String groupKey = (groupVec != null) ? groupVec[i] : "ALL";
            double val = (measureVec != null) ? measureVec[i] : 1.0;

            sumMap.put(groupKey, sumMap.getOrDefault(groupKey, 0.0) + val);
            countMap.put(groupKey, countMap.getOrDefault(groupKey, 0) + 1);

            if (!minMap.containsKey(groupKey) || val < minMap.get(groupKey)) {
                minMap.put(groupKey, val);
            }
            if (!maxMap.containsKey(groupKey) || val > maxMap.get(groupKey)) {
                maxMap.put(groupKey, val);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (String key : sumMap.keySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            if (groupByCol != null) {
                row.put(groupByCol, key);
            }

            double resultVal = switch (aggFunc) {
                case SUM -> sumMap.get(key);
                case COUNT -> countMap.get(key);
                case AVG -> countMap.get(key) > 0 ? (sumMap.get(key) / countMap.get(key)) : 0.0;
                case MIN -> minMap.getOrDefault(key, 0.0);
                case MAX -> maxMap.getOrDefault(key, 0.0);
            };

            // Round to 2 decimals
            row.put(measureCol + "_" + aggFunc.name().toLowerCase(), Math.round(resultVal * 100.0) / 100.0);
            results.add(row);
        }

        // Sort results descending
        String sortKey = measureCol + "_" + aggFunc.name().toLowerCase();
        results.sort((a, b) -> {
            Double v1 = ((Number) a.getOrDefault(sortKey, 0.0)).doubleValue();
            Double v2 = ((Number) b.getOrDefault(sortKey, 0.0)).doubleValue();
            return Double.compare(v2, v1);
        });

        long durationUs = (System.nanoTime() - startTime) / 1000;
        log.info("OLAP aggregated {} rows for table '{}' in {} µs ({} ms)", rowCount, tableName, durationUs, durationUs / 1000.0);

        return results;
    }

    public boolean hasTable(String tableName) {
        return datasetStore.containsKey(tableName.toLowerCase());
    }

    public void removeTable(String tableName) {
        datasetStore.remove(tableName.toLowerCase());
    }
}
