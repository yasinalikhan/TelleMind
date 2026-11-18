package com.telemind.analytics.autonomous;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class AutonomousRcaServiceTest {

    private AutonomousRcaService rcaService;
    private ActionDispatcherService actionDispatcher;

    @BeforeEach
    public void setup() {
        rcaService = new AutonomousRcaService(null);
        actionDispatcher = new ActionDispatcherService(rcaService);
    }

    @Test
    public void testAnomaliesGeneratedWithRca() {
        List<TelcoAnomaly> anomalies = rcaService.getAnomaliesForCurrentTenant();
        assertFalse(anomalies.isEmpty());

        TelcoAnomaly critical = anomalies.stream()
                .filter(a -> "CRITICAL".equals(a.severity()))
                .findFirst().orElseThrow();

        assertNotNull(critical.rootCauseAnalysis());
        assertTrue(critical.rootCauseAnalysis().contains("fiber"));
        assertFalse(critical.evidencePoints().isEmpty());
        assertFalse(critical.recommendedActions().isEmpty());
        assertEquals("OPEN", critical.status());
    }

    @Test
    public void testExecuteNocTicketAction() {
        List<TelcoAnomaly> anomalies = rcaService.getAnomaliesForCurrentTenant();
        TelcoAnomaly target = anomalies.get(0);

        ActionDispatcherService.ActionExecutionRequest req = new ActionDispatcherService.ActionExecutionRequest(
                target.id(),
                "DISPATCH_NOC_TICKET",
                "Dispatch Splicing Crew",
                Map.of("targetTower", "HRT-01")
        );

        ActionExecutionRecord record = actionDispatcher.executeAction(req);
        assertNotNull(record);
        assertEquals("COMPLETED", record.status());
        assertTrue(record.resultSummary().contains("Ticket #NOC-"));
        assertTrue(record.outputMetadata().containsKey("ticketNumber"));

        // Verify anomaly status transitioned
        Optional<TelcoAnomaly> updatedOpt = rcaService.getAnomalyById(target.id());
        assertTrue(updatedOpt.isPresent());
        assertEquals("ACTION_TAKEN", updatedOpt.get().status());
    }

    @Test
    public void testExecuteChurnCampaignAction() {
        ActionDispatcherService.ActionExecutionRequest req = new ActionDispatcherService.ActionExecutionRequest(
                "ANOM-TENANT_1-02",
                "TRIGGER_CHURN_CAMPAIGN",
                "Launch USSD Retention Offer",
                Map.of("cohortSize", 312)
        );

        ActionExecutionRecord record = actionDispatcher.executeAction(req);
        assertNotNull(record);
        assertTrue(record.resultSummary().contains("CMP-RET-"));
        assertEquals(312, record.outputMetadata().get("targetSubscribers"));
    }

    @Test
    public void testActionHistoryAuditing() {
        int initialSize = actionDispatcher.getActionHistoryForCurrentTenant().size();

        actionDispatcher.executeAction(new ActionDispatcherService.ActionExecutionRequest(
                "ANOM-TEST",
                "APPLY_QOS_TRAFFIC_SHAPING",
                "Traffic Shaping",
                Map.of("offloadPercent", "40%")
        ));

        List<ActionExecutionRecord> history = actionDispatcher.getActionHistoryForCurrentTenant();
        assertEquals(initialSize + 1, history.size());
        assertEquals("APPLY_QOS_TRAFFIC_SHAPING", history.get(0).actionType());
    }
}
