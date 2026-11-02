package com.telemind.analytics.ai;

import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

public class VisualizationServiceTest {

    private final VisualizationService service = new VisualizationService();

    @Test
    public void testEmptyDataReturnsCard() {
        var decision = service.decideVisualization("test", Collections.emptyList());
        assertEquals("card", decision.componentType());
        assertEquals("No Data", decision.title());
    }

    @Test
    public void testKpiCardForSingleRowSingleColumn() {
        Map<String, Object> row = Map.of("total_subscribers", 15200);
        var decision = service.decideVisualization("total subscribers", List.of(row));
        assertEquals("kpi", decision.componentType());
        assertEquals("Total subscribers", decision.title());
        assertEquals(15200, decision.props().get("value"));
    }

    @Test
    public void testGaugeChartForSingleRowNumericRate() {
        Map<String, Object> row = Map.of("network_health", 94);
        var decision = service.decideVisualization("show health rate gauge", List.of(row));
        assertEquals("chart", decision.componentType());
        assertEquals("gauge", decision.props().get("chartType"));
        assertEquals("network_health", decision.props().get("valueKey"));
    }

    @Test
    public void testScatterPlotForTwoNumerics() {
        Map<String, Object> row1 = new HashMap<>();
        row1.put("data_mb", 450);
        row1.put("cost", 35.5);
        row1.put("name", "User A");

        Map<String, Object> row2 = new HashMap<>();
        row2.put("data_mb", 900);
        row2.put("cost", 70.0);
        row2.put("name", "User B");

        var decision = service.decideVisualization("correlation between data_mb vs cost scatter", List.of(row1, row2));
        assertEquals("chart", decision.componentType());
        assertEquals("scatter", decision.props().get("chartType"));
        assertNotNull(decision.props().get("xAxis"));
        assertNotNull(decision.props().get("yAxis"));
    }

    @Test
    public void testDonutChartForShare() {
        Map<String, Object> row1 = Map.of("plan", "Prepaid", "count", 400);
        Map<String, Object> row2 = Map.of("plan", "Postpaid", "count", 600);
        var decision = service.decideVisualization("show subscriber plan share donut", List.of(row1, row2));
        assertEquals("chart", decision.componentType());
        assertEquals("donut", decision.props().get("chartType"));
        assertEquals("plan", decision.props().get("labelKey"));
        assertEquals("count", decision.props().get("valueKey"));
    }

    @Test
    public void testLineChartForTimeSeries() {
        Map<String, Object> row1 = Map.of("date", "2026-07-01", "amount", 1200);
        Map<String, Object> row2 = Map.of("date", "2026-07-02", "amount", 1500);
        var decision = service.decideVisualization("daily revenue trend", List.of(row1, row2));
        assertEquals("chart", decision.componentType());
        assertEquals("line", decision.props().get("chartType"));
        assertEquals("date", decision.props().get("xAxis"));
    }

    @Test
    public void testGoogleMapDecision() {
        Map<String, Object> row = Map.of("tower", "KBL-01", "region", "Kabul", "data_mb", 18400);
        var decision = service.decideVisualization("show base station towers on google map", List.of(row));
        assertEquals("google-map", decision.componentType());
        assertEquals("Google Maps Geospatial Network", decision.title());
    }

    @Test
    public void testLinkAnalysisDecision() {
        Map<String, Object> row = Map.of("msisdn", "+93799000101", "region", "Kabul", "plan", "Postpaid");
        var decision = service.decideVisualization("show link analysis caller network and fraud ring", List.of(row));
        assertEquals("link-analysis", decision.componentType());
        assertEquals("Telecom Link Analysis Graph", decision.title());
    }

    @Test
    public void testSpecializedBiChartsDecision() {
        Map<String, Object> row = Map.of("region", "Kabul", "amount", 5000);
        
        var radar = service.decideVisualization("show network radar capability", List.of(row));
        assertEquals("chart", radar.componentType());
        assertEquals("radar", radar.props().get("chartType"));

        var treemap = service.decideVisualization("market share treemap", List.of(row));
        assertEquals("chart", treemap.componentType());
        assertEquals("treemap", treemap.props().get("chartType"));

        var funnel = service.decideVisualization("subscriber conversion funnel", List.of(row));
        assertEquals("chart", funnel.componentType());
        assertEquals("funnel", funnel.props().get("chartType"));

        var waterfall = service.decideVisualization("financial walk waterfall", List.of(row));
        assertEquals("chart", waterfall.componentType());
        assertEquals("waterfall", waterfall.props().get("chartType"));

        var candlestick = service.decideVisualization("candlestick ohlc volatility", List.of(row));
        assertEquals("chart", candlestick.componentType());
        assertEquals("candlestick", candlestick.props().get("chartType"));
    }
}
