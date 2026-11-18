package com.telemind.analytics.query;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Enterprise Query Caching Service.
 * Provides tenant-isolated, TTL-expiring, memory-bounded in-memory caching
 * for analytical query results to prevent repetitive database strain.
 */
@Service
public class QueryCacheService {

    private static final Logger log = LoggerFactory.getLogger(QueryCacheService.class);

    private final long ttlMillis;
    private final int maxEntries;

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final AtomicLong hitCount = new AtomicLong(0);
    private final AtomicLong missCount = new AtomicLong(0);

    public QueryCacheService(
            @Value("${analytics.cache.ttl-seconds:120}") long ttlSeconds,
            @Value("${analytics.cache.max-entries:1000}") int maxEntries) {
        this.ttlMillis = ttlSeconds * 1000;
        this.maxEntries = maxEntries;
        log.info("Initialized QueryCacheService (TTL: {}s, MaxEntries: {})", ttlSeconds, maxEntries);
    }

    public record CacheEntry(
            String tenantId,
            List<Map<String, Object>> data,
            long creationTime,
            long expirationTime
    ) {}

    /**
     * Builds a deterministic tenant-isolated cache key.
     */
    public String buildCacheKey(String tenantId, String sql, Object[] args) {
        String safeTenant = tenantId != null ? tenantId : "anonymous";
        String normalizedSql = sql.trim().replaceAll("\\s+", " ").toLowerCase();
        String argsString = args != null && args.length > 0 ? Arrays.deepToString(args) : "[]";
        return safeTenant + "::" + normalizedSql + "::" + argsString;
    }

    /**
     * Retrieves cached query results if present and unexpired.
     */
    public Optional<List<Map<String, Object>>> get(String tenantId, String sql, Object[] args) {
        String key = buildCacheKey(tenantId, sql, args);
        CacheEntry entry = cache.get(key);

        if (entry == null) {
            missCount.incrementAndGet();
            return Optional.empty();
        }

        if (System.currentTimeMillis() > entry.expirationTime()) {
            cache.remove(key);
            missCount.incrementAndGet();
            log.debug("Cache expired for key: {}", key);
            return Optional.empty();
        }

        hitCount.incrementAndGet();
        log.debug("Cache hit for tenant {} (hits: {}, misses: {})", tenantId, hitCount.get(), missCount.get());
        return Optional.of(deepCopy(entry.data()));
    }

    /**
     * Stores query result in tenant-isolated cache.
     */
    public void put(String tenantId, String sql, Object[] args, List<Map<String, Object>> data) {
        if (data == null) {
            return;
        }

        // Evict expired or enforce max size
        if (cache.size() >= maxEntries) {
            evictExpiredOrOldest();
        }

        String key = buildCacheKey(tenantId, sql, args);
        long now = System.currentTimeMillis();
        CacheEntry entry = new CacheEntry(tenantId, deepCopy(data), now, now + ttlMillis);
        cache.put(key, entry);
    }

    /**
     * Invalidate all cached queries for a given tenant (e.g. after CSV dataset upload or update).
     */
    public void invalidateTenant(String tenantId) {
        if (tenantId == null) {
            return;
        }
        int before = cache.size();
        cache.entrySet().removeIf(e -> tenantId.equals(e.getValue().tenantId()));
        int removed = before - cache.size();
        log.info("Invalidated {} cached queries for tenant: {}", removed, tenantId);
    }

    /**
     * Clear all cached queries across all tenants.
     */
    public void invalidateAll() {
        cache.clear();
        log.info("QueryCache cleared completely.");
    }

    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        long hits = hitCount.get();
        long misses = missCount.get();
        long total = hits + misses;
        double hitRatio = total > 0 ? (double) hits / total : 0.0;

        stats.put("size", cache.size());
        stats.put("maxEntries", maxEntries);
        stats.put("ttlSeconds", ttlMillis / 1000);
        stats.put("hits", hits);
        stats.put("misses", misses);
        stats.put("hitRatio", String.format("%.2f%%", hitRatio * 100));
        return stats;
    }

    private void evictExpiredOrOldest() {
        long now = System.currentTimeMillis();
        cache.entrySet().removeIf(e -> now > e.getValue().expirationTime());

        if (cache.size() >= maxEntries) {
            // Evict oldest 20%
            List<Map.Entry<String, CacheEntry>> entries = new ArrayList<>(cache.entrySet());
            entries.sort(Comparator.comparingLong(e -> e.getValue().creationTime()));
            int toRemove = Math.max(1, entries.size() / 5);
            for (int i = 0; i < toRemove; i++) {
                cache.remove(entries.get(i).getKey());
            }
        }
    }

    private List<Map<String, Object>> deepCopy(List<Map<String, Object>> original) {
        List<Map<String, Object>> copy = new ArrayList<>(original.size());
        for (Map<String, Object> row : original) {
            copy.add(new LinkedHashMap<>(row));
        }
        return copy;
    }
}
