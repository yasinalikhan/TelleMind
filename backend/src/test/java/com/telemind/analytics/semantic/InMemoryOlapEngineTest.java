package com.telemind.analytics.semantic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class InMemoryOlapEngineTest {

    private InMemoryOlapEngine olapEngine;

    @BeforeEach
    public void setup() {
        olapEngine = new InMemoryOlapEngine();
    }

    @Test
    public void testIngestAndAggregate() {
        List<String> headers = List.of("region", "amount", "traffic_mb");
        List<List<String>> rows = List.of(
                List.of("Kabul", "100.5", "500"),
                List.of("Kabul", "200.0", "1500"),
                List.of("Herat", "80.0", "400"),
                List.of("Mazar", "150.0", "800"),
                List.of("Herat", "120.0", "600")
        );

        olapEngine.ingestTable("sales_traffic", headers, rows);
        assertTrue(olapEngine.hasTable("sales_traffic"));

        // Sum amount by region
        List<Map<String, Object>> sumResults = olapEngine.aggregate(
                "sales_traffic",
                "amount",
                InMemoryOlapEngine.AggFunction.SUM,
                "region",
                null,
                null
        );

        assertFalse(sumResults.isEmpty());
        // Kabul sum should be 300.5
        Map<String, Object> kabul = sumResults.stream()
                .filter(r -> "Kabul".equals(r.get("region")))
                .findFirst().orElseThrow();
        assertEquals(300.5, ((Number) kabul.get("amount_sum")).doubleValue(), 0.01);

        // Herat sum should be 200.0
        Map<String, Object> herat = sumResults.stream()
                .filter(r -> "Herat".equals(r.get("region")))
                .findFirst().orElseThrow();
        assertEquals(200.0, ((Number) herat.get("amount_sum")).doubleValue(), 0.01);
    }

    @Test
    public void testVectorizedFilter() {
        List<String> headers = List.of("region", "data_mb");
        List<List<String>> rows = List.of(
                List.of("Kabul", "1000"),
                List.of("Herat", "500"),
                List.of("Kabul", "2000")
        );

        olapEngine.ingestTable("traffic", headers, rows);

        // Filter only Kabul
        List<Map<String, Object>> filtered = olapEngine.aggregate(
                "traffic",
                "data_mb",
                InMemoryOlapEngine.AggFunction.SUM,
                "region",
                "region",
                "Kabul"
        );

        assertEquals(1, filtered.size());
        assertEquals("Kabul", filtered.get(0).get("region"));
        assertEquals(3000.0, ((Number) filtered.get(0).get("data_mb_sum")).doubleValue(), 0.01);
    }
}
