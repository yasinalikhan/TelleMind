package com.telemind.analytics.query;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class QueryCacheServiceTest {

    private QueryCacheService cacheService;

    @BeforeEach
    public void setup() {
        // 2 second TTL, max 10 entries for testing
        cacheService = new QueryCacheService(2, 10);
    }

    @Test
    public void testCacheHitAndMiss() {
        String sql = "SELECT * FROM subscriber";
        String tenantId = "tenant_1";
        Object[] args = new Object[]{};

        // Initially a miss
        Optional<List<Map<String, Object>>> cached = cacheService.get(tenantId, sql, args);
        assertTrue(cached.isEmpty());

        // Put data
        List<Map<String, Object>> data = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("msisdn", "+93799000101");
        data.add(row);
        cacheService.put(tenantId, sql, args, data);

        // Now a hit
        cached = cacheService.get(tenantId, sql, args);
        assertTrue(cached.isPresent());
        assertEquals(1, cached.get().size());
        assertEquals("+93799000101", cached.get().get(0).get("msisdn"));
    }

    @Test
    public void testTenantIsolationInCache() {
        String sql = "SELECT * FROM revenue";
        Object[] args = new Object[]{};

        List<Map<String, Object>> dataTenant1 = List.of(Map.of("amount", 100));
        cacheService.put("tenant_1", sql, args, dataTenant1);

        // Tenant 2 must NOT receive tenant 1's cached results
        Optional<List<Map<String, Object>>> tenant2Result = cacheService.get("tenant_2", sql, args);
        assertTrue(tenant2Result.isEmpty(), "Cross-tenant cache access must be prevented");
    }

    @Test
    public void testInvalidateTenant() {
        String sql = "SELECT * FROM usage";
        Object[] args = new Object[]{};

        cacheService.put("tenant_1", sql, args, List.of(Map.of("mb", 500)));
        cacheService.put("tenant_2", sql, args, List.of(Map.of("mb", 800)));

        // Invalidate tenant 1
        cacheService.invalidateTenant("tenant_1");

        assertTrue(cacheService.get("tenant_1", sql, args).isEmpty(), "Tenant 1 cache should be cleared");
        assertTrue(cacheService.get("tenant_2", sql, args).isPresent(), "Tenant 2 cache should remain intact");
    }

    @Test
    public void testDeepCopyImmutability() {
        String sql = "SELECT * FROM revenue";
        List<Map<String, Object>> original = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("amount", 500);
        original.add(row);

        cacheService.put("tenant_1", sql, new Object[]{}, original);

        // Fetch copy and mutate it
        List<Map<String, Object>> fetched = cacheService.get("tenant_1", sql, new Object[]{}).orElseThrow();
        fetched.get(0).put("amount", 9999);

        // Fetch again, ensure cached value was not corrupted
        List<Map<String, Object>> fetchedAgain = cacheService.get("tenant_1", sql, new Object[]{}).orElseThrow();
        assertEquals(500, fetchedAgain.get(0).get("amount"), "Cached value should remain unaffected by mutation");
    }
}
