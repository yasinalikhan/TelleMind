package com.telemind.analytics.a2ui;

import com.telemind.analytics.ai.VisualizationService.VisualizationDecision;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResponseBuilderService {

    @SuppressWarnings("unchecked")
    public A2UIResponse buildResponse(String pageTitle, VisualizationDecision decision) {
        return buildResponse(pageTitle, decision, Collections.emptyMap());
    }

    @SuppressWarnings("unchecked")
    public A2UIResponse buildResponse(String pageTitle, VisualizationDecision decision, Map<String, Object> metadata) {
        List<A2UIComponent> components = new java.util.ArrayList<>();

        // Convert Map-based events to A2UIEvent records
        List<A2UIEvent> events = decision.events().stream()
                .map(e -> {
                    Map<String, Object> actMap = (Map<String, Object>) e.get("action");
                    String type = (String) actMap.get("type");
                    String target = (String) actMap.get("target");
                    // If this is a map, redirect regional clicks to FILTER_DATA targeting the details-table
                    if ("map".equals(decision.componentType())) {
                        type = "FILTER_DATA";
                        target = "details-table";
                    }
                    A2UIAction action = new A2UIAction(
                            type,
                            target,
                            (String) actMap.get("parameter")
                    );
                    return new A2UIEvent((String) e.get("event"), action);
                })
                .collect(Collectors.toList());

        // Create the primary dynamic A2UI component
        A2UIComponent primaryComponent = new A2UIComponent(
                "map".equals(decision.componentType()) ? "details-map" : UUID.randomUUID().toString(),
                decision.componentType(),
                decision.props(),
                events
        );
        components.add(primaryComponent);

        // If component is a map, append a secondary details table
        if ("map".equals(decision.componentType())) {
            Map<String, Object> tableProps = new java.util.HashMap<>(decision.props());
            tableProps.put("title", "Regional Details");
            // Set columns for table
            List<?> rawData = (List<?>) decision.props().get("data");
            if (rawData != null && !rawData.isEmpty()) {
                Map<?, ?> firstRow = (Map<?, ?>) rawData.get(0);
                tableProps.put("columns", firstRow.keySet().stream().filter(c -> !c.equals("tenant_id")).toList());
            }
            A2UIComponent tableComponent = new A2UIComponent(
                    "details-table",
                    "table",
                    tableProps,
                    Collections.emptyList()
            );
            components.add(tableComponent);
        }

        // Build the A2UI page metadata and grid layout
        A2UIPage page = new A2UIPage(
                pageTitle,
                "grid",
                components
        );

        // Wrap into A2UIResponse
        return new A2UIResponse(
                "1.0.0",
                page,
                Collections.emptyList(),
                metadata
        );
    }
}
