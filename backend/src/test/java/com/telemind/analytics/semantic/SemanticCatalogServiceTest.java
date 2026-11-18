package com.telemind.analytics.semantic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class SemanticCatalogServiceTest {

    private SemanticCatalogService catalogService;

    @BeforeEach
    public void setup() {
        catalogService = new SemanticCatalogService();
    }

    @Test
    public void testCertifiedMetricsAvailable() {
        assertFalse(catalogService.getAllMetrics().isEmpty());
        assertTrue(catalogService.getMetric("arpu").isPresent());
        assertTrue(catalogService.getMetric("churn_rate").isPresent());
        assertTrue(catalogService.getMetric("data_traffic_gb").isPresent());
        assertTrue(catalogService.getMetric("mou").isPresent());
    }

    @Test
    public void testDimensionsAvailable() {
        assertFalse(catalogService.getAllDimensions().isEmpty());
        assertTrue(catalogService.getDimension("region").isPresent());
        assertTrue(catalogService.getDimension("plan").isPresent());
        assertTrue(catalogService.getDimension("tower").isPresent());
    }

    @Test
    public void testResolveArpuByRegion() {
        Optional<String> sqlOpt = catalogService.resolveSemanticQuery("Show ARPU by region");
        assertTrue(sqlOpt.isPresent());
        String sql = sqlOpt.get();
        assertTrue(sql.contains("region"));
        assertTrue(sql.contains("ROUND(AVG(recharge_amount), 2)"));
        assertTrue(sql.contains("FROM subscriber"));
        assertTrue(sql.contains("GROUP BY region"));
    }

    @Test
    public void testResolveChurnRateByPlan() {
        Optional<String> sqlOpt = catalogService.resolveSemanticQuery("What is the churn rate by plan?");
        assertTrue(sqlOpt.isPresent());
        String sql = sqlOpt.get();
        assertTrue(sql.contains("plan"));
        assertTrue(sql.contains("COUNT(CASE WHEN status = 'Inactive' THEN 1 END)"));
        assertTrue(sql.contains("FROM subscriber"));
        assertTrue(sql.contains("GROUP BY plan"));
    }

    @Test
    public void testResolveDataTrafficInGbByTower() {
        Optional<String> sqlOpt = catalogService.resolveSemanticQuery("Show data traffic in gb by tower");
        assertTrue(sqlOpt.isPresent());
        String sql = sqlOpt.get();
        assertTrue(sql.contains("tower"));
        assertTrue(sql.contains("ROUND(SUM(data_mb) / 1024.0, 2)"));
        assertTrue(sql.contains("FROM usage"));
        assertTrue(sql.contains("GROUP BY tower"));
    }

    @Test
    public void testPromptInjectionFormat() {
        String prompt = catalogService.getCertifiedMetricsPrompt();
        assertNotNull(prompt);
        assertTrue(prompt.contains("CERTIFIED TELECOM SEMANTIC METRICS"));
        assertTrue(prompt.contains("arpu"));
        assertTrue(prompt.contains("churn_rate"));
        assertTrue(prompt.contains("ROUND(AVG(recharge_amount), 2)"));
    }
}
