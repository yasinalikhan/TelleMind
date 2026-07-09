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
        // Convert Map-based events to A2UIEvent records
        List<A2UIEvent> events = decision.events().stream()
                .map(e -> {
                    Map<String, Object> actMap = (Map<String, Object>) e.get("action");
                    A2UIAction action = new A2UIAction(
                            (String) actMap.get("type"),
                            (String) actMap.get("target"),
                            (String) actMap.get("parameter")
                    );
                    return new A2UIEvent((String) e.get("event"), action);
                })
                .collect(Collectors.toList());

        // Create the dynamic A2UI component
        A2UIComponent component = new A2UIComponent(
                UUID.randomUUID().toString(),
                decision.componentType(),
                decision.props(),
                events
        );

        // Build the A2UI page metadata and grid layout
        A2UIPage page = new A2UIPage(
                pageTitle,
                "grid",
                List.of(component)
        );

        // Wrap into A2UIResponse
        return new A2UIResponse(
                "1.0.0",
                page,
                Collections.emptyList()
        );
    }
}
