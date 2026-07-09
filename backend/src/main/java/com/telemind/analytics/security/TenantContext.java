package com.telemind.analytics.security;

public class TenantContext {
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public static void setCurrentTenant(String tenantId) {
        currentTenant.set(tenantId);
    }

    public static String getCurrentTenant() {
        String tenant = currentTenant.get();
        return tenant != null ? tenant : "tenant_default";
    }

    public static void clear() {
        currentTenant.remove();
    }
}
