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

        // 1. KPI Card: single row, single column (numeric or count) OR explicitly asked "how many" / "total" with a single value
        if (rowCount == 1 && columns.size() == 1) {
            String colName = columns.iterator().next();
            Object val = firstRow.get(colName);
            Map<String, Object> props = new HashMap<>();
            props.put("title", formatTitle(colName));
            props.put("value", val);
            props.put("metric", colName);
            return new VisualizationDecision("kpi", formatTitle(colName), props, Collections.emptyList());
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

        // 5. Pie Chart: percentage distribution (e.g. by plan or status) and relatively few rows
        if ((columns.contains("plan") || columns.contains("status")) && rowCount <= 10) {
            String labelCol = columns.contains("plan") ? "plan" : "status";
            String valCol = columns.stream()
                    .filter(c -> !c.equals(labelCol) && !c.equals("tenant_id"))
                    .findFirst()
                    .orElse("count");

            Map<String, Object> props = new HashMap<>();
            props.put("chartType", "pie");
            props.put("title", "Subscriber Plan Distribution");
            props.put("labelKey", labelCol);
            props.put("valueKey", valCol);
            props.put("data", data);
            return new VisualizationDecision("chart", "Distribution", props, Collections.emptyList());
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
