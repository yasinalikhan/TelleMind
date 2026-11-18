package com.telemind.analytics.controller;

import com.telemind.analytics.autonomous.*;
import com.telemind.analytics.autonomous.ActionDispatcherService.ActionExecutionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/autonomous")
public class AutonomousController {

    private static final Logger log = LoggerFactory.getLogger(AutonomousController.class);

    private final AutonomousRcaService rcaService;
    private final ActionDispatcherService actionDispatcherService;

    @Autowired
    public AutonomousController(
            AutonomousRcaService rcaService,
            ActionDispatcherService actionDispatcherService) {
        this.rcaService = rcaService;
        this.actionDispatcherService = actionDispatcherService;
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<TelcoAnomaly>> getAnomalies() {
        return ResponseEntity.ok(rcaService.getAnomaliesForCurrentTenant());
    }

    @GetMapping("/anomalies/{id}")
    public ResponseEntity<?> getAnomaly(@PathVariable String id) {
        Optional<TelcoAnomaly> anom = rcaService.getAnomalyById(id);
        if (anom.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(anom.get());
    }

    @PostMapping("/scan")
    public ResponseEntity<List<TelcoAnomaly>> triggerScan() {
        return ResponseEntity.ok(rcaService.runFreshScan());
    }

    @PostMapping("/actions/execute")
    public ResponseEntity<?> executeAction(@RequestBody ActionExecutionRequest request) {
        if (request.actionType() == null || request.actionType().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "actionType is required"));
        }

        try {
            ActionExecutionRecord record = actionDispatcherService.executeAction(request);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            log.error("Failed to execute closed-loop autonomous action", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Action execution failed: " + e.getMessage()));
        }
    }

    @GetMapping("/actions/history")
    public ResponseEntity<List<ActionExecutionRecord>> getActionHistory() {
        return ResponseEntity.ok(actionDispatcherService.getActionHistoryForCurrentTenant());
    }
}
