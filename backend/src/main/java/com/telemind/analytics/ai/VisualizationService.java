package com.telemind.analytics.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VisualizationService {

    private static final Logger log = LoggerFactory.getLogger(VisualizationService.class);

    public record VisualizationDecision(String componentType, String title, Map<String, Object> props, List<Map<String, Object>> events) {}

    public VisualizationDecision decideVisualization(String question, List<Map<String, Object>> data) {
        if (data == null || data.isEmpty()) {
            Map<String, Object> props = new HashMap<>();
            props.put("title", "No Data Found");
            props.put("data", Collections.emptyList());
            return new VisualizationDecision("card", "No Data", props, Collections.emptyList());
        }

        String q = question.toLowerCase();
        Map<String, Object> firstRow = data.get(0);
        Set<String> columns = firstRow.keySet();
        int rowCount = data.size();

        // 1a. Google Maps Geospatial Studio Component
        if (q.contains("google map") || q.contains("gis") || q.contains("tower coordinates") || q.contains("telecom coverage") || q.contains("base station")) {
            Map<String, Object> props = new HashMap<>();
            props.put("title", "Google Maps Telecom Geospatial Center");
            props.put("data", data);
            return new VisualizationDecision("google-map", "Google Maps Geospatial Network", props, Collections.emptyList());
        }

        // 1b. Link Analysis / Network Graph Component
        if (q.contains("link analysis") || q.contains("network graph") || q.contains("caller graph") || q.contains("fraud ring") || q.contains("cdr graph") || q.contains("handoff") || q.contains("connections")) {
            Map<String, Object> props = new HashMap<>();
            props.put("title", "Telecom Link Analysis & Relationship Graph");
            props.put("data", data);
            return new VisualizationDecision("link-analysis", "Telecom Link Analysis Graph", props, Collections.emptyList());
        }

        // 1c. Specialized Top BI Charts (Radar, Treemap, Funnel, Waterfall, Boxplot, Bullet, Candlestick, Polar, Sankey, Sparkline, Chord)
        if (q.contains("radar") || q.contains("spider")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "radar");
            props.put("title", "Network Capability Radar Profile");
            props.put("data", data);
            return new VisualizationDecision("chart", "Network Radar Profile", props, Collections.emptyList());
        }
        if (q.contains("treemap") || q.contains("hierarchical")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "treemap");
            props.put("title", "Market Share Treemap Composition");
            props.put("data", data);
            return new VisualizationDecision("chart", "Market Share Treemap", props, Collections.emptyList());
        }
        if (q.contains("funnel") || q.contains("conversion") || q.contains("pipeline")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "funnel");
            props.put("title", "Subscriber Conversion Funnel");
            props.put("data", data);
            return new VisualizationDecision("chart", "Subscriber Funnel", props, Collections.emptyList());
        }
        if (q.contains("waterfall") || q.contains("variance") || q.contains("financial walk")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "waterfall");
            props.put("title", "Revenue Variance Waterfall Walk");
            props.put("data", data);
            return new VisualizationDecision("chart", "Financial Waterfall", props, Collections.emptyList());
        }
        if (q.contains("bullet") || q.contains("benchmark") || q.contains("sla target")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "bullet");
            props.put("title", "Target SLA Bullet Benchmark");
            props.put("data", data);
            return new VisualizationDecision("chart", "Bullet SLA Benchmark", props, Collections.emptyList());
        }
        if (q.contains("candlestick") || q.contains("ohlc") || q.contains("volatility")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "candlestick");
            props.put("title", "Traffic Volatility Candlestick (OHLC)");
            props.put("data", data);
            return new VisualizationDecision("chart", "Traffic Candlestick", props, Collections.emptyList());
        }
        if (q.contains("polar") || q.contains("rose chart")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "polar");
            props.put("title", "Polar Usage Distribution");
            props.put("data", data);
            return new VisualizationDecision("chart", "Polar Area Distribution", props, Collections.emptyList());
        }
        if (q.contains("sankey") || q.contains("flow")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "sankey");
            props.put("title", "Network Traffic Sankey Flow");
            props.put("data", data);
            return new VisualizationDecision("chart", "Sankey Flow Diagram", props, Collections.emptyList());
        }
        if (q.contains("sparkline") || q.contains("velocity") || q.contains("scorecard")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "sparkline");
            props.put("title", "Weekly Revenue Velocity Scorecard");
            props.put("data", data);
            return new VisualizationDecision("chart", "Revenue Velocity Sparkline", props, Collections.emptyList());
        }
        if (q.contains("stacked bar") || q.contains("traffic mix")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "stacked_bar");
            props.put("title", "Regional Traffic Mix (Data, Voice, SMS)");
            props.put("xAxis", "region");
            props.put("data", data);
            return new VisualizationDecision("chart", "Traffic Mix Stacked Bar", props, Collections.emptyList());
        }
        if (q.contains("stacked area") || q.contains("4g vs 5g") || q.contains("traffic trajectory")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "stacked_area");
            props.put("title", "4G vs 5G Traffic Trajectory Over Time");
            props.put("xAxis", "date");
            props.put("data", data);
            return new VisualizationDecision("chart", "Network Traffic Trajectory", props, Collections.emptyList());
        }
        if (q.contains("boxplot") || q.contains("whisker") || q.contains("quartile") || q.contains("speed distribution")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "boxplot");
            props.put("title", "Network Latency & Speed Distribution");
            props.put("data", data);
            return new VisualizationDecision("chart", "Latency Boxplot Distribution", props, Collections.emptyList());
        }
        if (q.contains("chord") || q.contains("interconnect") || q.contains("dependency matrix")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "chord");
            props.put("title", "Provincial Interconnect Traffic Dependency");
            props.put("data", data);
            return new VisualizationDecision("chart", "Interconnect Chord Matrix", props, Collections.emptyList());
        }
        if (q.contains("horizontal bar") || q.contains("ranking") || q.contains("leaderboard")) {
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "horizontal_bar");
            props.put("title", "Regional Leaderboard Ranking");
            props.put("xAxis", "region");
            props.put("yAxis", "amount");
            props.put("data", data);
            return new VisualizationDecision("chart", "Leaderboard Ranking", props, Collections.emptyList());
        }

        // 1. Gauge Meter: if question mentions gauge/percent/rate/health/efficiency/sla and there is a single numeric value in the result
        if (rowCount == 1) {
            String numericCol = null;
            for (String col : columns) {
                if (col.equals("tenant_id") || col.equals("id")) continue;
                if (firstRow.get(col) instanceof Number) {
                    numericCol = col;
                    break;
                }
            }
            if (numericCol != null && (q.contains("gauge") || q.contains("percent") || q.contains("rate") || q.contains("health") || q.contains("efficiency") || q.contains("sla"))) {
                Map<String, Object> props = new HashMap<>();
                props.put("chartType", "gauge");
                props.put("title", formatTitle(numericCol) + " Index");
                props.put("valueKey", numericCol);
                props.put("data", data);
                return new VisualizationDecision("chart", formatTitle(numericCol) + " Gauge", props, Collections.emptyList());
            }
        }

        // 1b. KPI Card: single row, single column (numeric or count) OR explicitly asked "how many" / "total" with a single value
        if (rowCount == 1 && columns.size() == 1) {
            String colName = columns.iterator().next();
            Object val = firstRow.get(colName);
            Map<String, Object> props = new HashMap<>();
            props.put("title", formatTitle(colName));
            props.put("value", val);
            props.put("metric", colName);
            return new VisualizationDecision("kpi", formatTitle(colName), props, Collections.emptyList());
        }

        // 1c. Scatter Plot: if query asks for correlation/scatter/vs and there are at least two numeric fields
        List<String> numericCols = new ArrayList<>();
        for (String col : columns) {
            if (col.equals("tenant_id") || col.equals("id")) continue;
            if (firstRow.get(col) instanceof Number) {
                numericCols.add(col);
            }
        }
        if (numericCols.size() >= 2 && (q.contains("scatter") || q.contains(" vs ") || q.contains("correlation") || q.contains("relationship") || q.contains("bubble"))) {
            String xAxis = numericCols.get(0);
            String yAxis = numericCols.get(1);
            // Re-order based on query string keywords
            for (String col : numericCols) {
                if (q.contains(col.toLowerCase() + " vs") || q.contains("show " + col.toLowerCase())) {
                    xAxis = col;
                } else if (q.contains("vs " + col.toLowerCase()) || q.contains("and " + col.toLowerCase())) {
                    yAxis = col;
                }
            }
            if (xAxis.equals(yAxis)) {
                String finalX = xAxis;
                yAxis = numericCols.stream().filter(c -> !c.equals(finalX)).findFirst().orElse(yAxis);
            }
            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "scatter");
            props.put("title", formatTitle(xAxis) + " vs " + formatTitle(yAxis));
            props.put("xAxis", xAxis);
            props.put("yAxis", yAxis);
            props.put("data", data);
            return new VisualizationDecision("chart", formatTitle(xAxis) + " vs " + formatTitle(yAxis), props, Collections.emptyList());
        }

        // 2. Heatmap: if question contains "heatmap"
        if (q.contains("heatmap")) {
            Map<String, Object> props = new HashMap<>();
            props.put("title", "Network Traffic Heatmap");
            props.put("data", data);
            props.put("chartType", "heatmap");
            props.put("xAxis", "tower");
            props.put("yAxis", "region");
            props.put("value", "data_mb");
            return new VisualizationDecision("chart", "Traffic Heatmap", props, Collections.emptyList());
        }

        // 3. Geo Map: if columns contain "province" or question contains "map" or "province"
        if (columns.contains("province") || q.contains("map") || q.contains("province")) {
            Map<String, Object> props = new HashMap<>();
            props.put("title", "Regional Subscriber Distribution");
            props.put("data", data);
            props.put("regionKey", columns.contains("province") ? "province" : "region");
            props.put("valueKey", columns.contains("count") ? "count" : (columns.contains("data_mb") ? "data_mb" : "amount"));
            
            // Add Drill Down Event for map region clicks
            List<Map<String, Object>> events = new ArrayList<>();
            Map<String, Object> drillDownEvent = new HashMap<>();
            drillDownEvent.put("event", "click");
            
            Map<String, Object> action = new HashMap<>();
            action.put("type", "DRILL_DOWN");
            action.put("target", "subscriber_details");
            action.put("parameter", "region");
            drillDownEvent.put("action", action);
            events.add(drillDownEvent);

            return new VisualizationDecision("map", "Telecom Regional Map", props, events);
        }

        // 4. Line Chart: date/time series (columns contain "date" or "timestamp")
        if (columns.contains("date") || columns.contains("timestamp")) {
            String xAxis = columns.contains("date") ? "date" : "timestamp";
            String yAxis = columns.stream()
                    .filter(c -> !c.equals(xAxis) && !c.equals("tenant_id"))
                    .findFirst()
                    .orElse("amount");

            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "line");
            props.put("title", "Daily Revenue Trend");
            props.put("xAxis", xAxis);
            props.put("yAxis", yAxis);
            props.put("data", data);
            return new VisualizationDecision("chart", "Daily Analytics Trend", props, Collections.emptyList());
        }

        // 5. Pie / Donut Chart: percentage distribution (1 string/categorical + 1 numeric, <= 10 rows)
        List<String> categoricalCols = new ArrayList<>();
        List<String> valueCols = new ArrayList<>();
        for (String col : columns) {
            if (col.equals("tenant_id") || col.equals("id")) continue;
            Object val = firstRow.get(col);
            if (val instanceof Number) {
                valueCols.add(col);
            } else {
                categoricalCols.add(col);
            }
        }
        if (!categoricalCols.isEmpty() && !valueCols.isEmpty() && rowCount <= 10) {
            boolean useDonut = q.contains("donut") || q.contains("share") || q.contains("proportion") || q.contains("ratio");
            String labelCol = categoricalCols.get(0);
            String valCol = valueCols.get(0);

            Map<String, Object> props = new HashMap<>();
            props.put("chartType", useDonut ? "donut" : "pie");
            props.put("title", formatTitle(labelCol) + (useDonut ? " Share" : " Distribution"));
            props.put("labelKey", labelCol);
            props.put("valueKey", valCol);
            props.put("data", data);
            return new VisualizationDecision("chart", formatTitle(labelCol) + (useDonut ? " Donut Share View" : " Distribution"), props, Collections.emptyList());
        }

        // 6. Bar Chart: category comparison (e.g. revenue by region)
        if (columns.contains("region") && rowCount <= 15) {
            String valCol = columns.stream()
                    .filter(c -> !c.equals("region") && !c.equals("tenant_id") && !c.equals("id"))
                    .findFirst()
                    .orElse("amount");

            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "bar");
            props.put("title", "Regional Comparison");
            props.put("xAxis", "region");
            props.put("yAxis", valCol);
            props.put("data", data);
            
            // Add click event to drill down to details
            List<Map<String, Object>> events = new ArrayList<>();
            Map<String, Object> clickEvent = new HashMap<>();
            clickEvent.put("event", "click");
            Map<String, Object> action = new HashMap<>();
            action.put("type", "DRILL_DOWN");
            action.put("target", "region_detail");
            action.put("parameter", "region");
            clickEvent.put("action", action);
            events.add(clickEvent);

            return new VisualizationDecision("chart", "Regional Analytics", props, events);
        }

        // 7. Data Table: large records or raw list
        Map<String, Object> props = new HashMap<>();
        props.put("title", "Subscriber Details Data Table");
        props.put("data", data);
        props.put("columns", columns.stream().filter(c -> !c.equals("tenant_id")).toList());
        return new VisualizationDecision("table", "Data Table Details", props, Collections.emptyList());
    }

    private String formatTitle(String colName) {
        String title = colName.replace("_", " ");
        return Character.toUpperCase(title.charAt(0)) + title.substring(1);
    }
}
