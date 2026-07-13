package com.telemind.analytics.controller;

import com.telemind.analytics.model.DashboardConfig;
import com.telemind.analytics.repository.DashboardRepository;
import com.telemind.analytics.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/dashboards")
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);

    private final DashboardRepository dashboardRepository;

    public DashboardController(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    @GetMapping
    public ResponseEntity<List<DashboardConfig>> getAllDashboards() {
        String tenantId = TenantContext.getCurrentTenant();
        log.info("Fetching dashboards for tenant: {}", tenantId);
        List<DashboardConfig> dashboards = dashboardRepository.findByTenantId(tenantId);
        return ResponseEntity.ok(dashboards);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDashboardById(@PathVariable Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        log.info("Fetching dashboard {} for tenant: {}", id, tenantId);
        Optional<DashboardConfig> configOpt = dashboardRepository.findByIdAndTenantId(id, tenantId);
        if (configOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(configOpt.get());
    }

    @PostMapping
    public ResponseEntity<?> createDashboard(@RequestBody Map<String, String> request) {
        String tenantId = TenantContext.getCurrentTenant();
        String name = request.get("name");
        String layoutConfig = request.getOrDefault("layoutConfig", "[]");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dashboard name is required"));
        }

        log.info("Creating dashboard '{}' for tenant: {}", name, tenantId);
        DashboardConfig config = new DashboardConfig();
        config.setName(name);
        config.setTenantId(tenantId);
        config.setLayoutConfig(layoutConfig);

        DashboardConfig saved = dashboardRepository.save(config);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDashboard(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String tenantId = TenantContext.getCurrentTenant();
        Optional<DashboardConfig> configOpt = dashboardRepository.findByIdAndTenantId(id, tenantId);
        if (configOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String name = request.get("name");
        String layoutConfig = request.get("layoutConfig");

        DashboardConfig config = configOpt.get();
        if (name != null && !name.trim().isEmpty()) {
            config.setName(name);
        }
        if (layoutConfig != null) {
            config.setLayoutConfig(layoutConfig);
        }

        log.info("Updating dashboard {} ('{}') for tenant: {}", id, config.getName(), tenantId);
        DashboardConfig saved = dashboardRepository.save(config);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDashboard(@PathVariable Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        Optional<DashboardConfig> configOpt = dashboardRepository.findByIdAndTenantId(id, tenantId);
        if (configOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        log.info("Deleting dashboard {} for tenant: {}", id, tenantId);
        dashboardRepository.delete(configOpt.get());
        return ResponseEntity.ok(Map.of("message", "Dashboard deleted successfully"));
    }
}
