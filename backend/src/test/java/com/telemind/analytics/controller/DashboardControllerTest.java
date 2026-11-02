package com.telemind.analytics.controller;

import com.telemind.analytics.model.DashboardConfig;
import com.telemind.analytics.repository.DashboardRepository;
import com.telemind.analytics.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DashboardControllerTest {

    @Mock
    private DashboardRepository dashboardRepository;

    @InjectMocks
    private DashboardController dashboardController;

    @BeforeEach
    public void setup() {
        TenantContext.setCurrentTenant("tenant_1");
    }

    @AfterEach
    public void tearDown() {
        TenantContext.clear();
    }

    @Test
    public void testGetAllDashboards() {
        DashboardConfig db1 = new DashboardConfig();
        db1.setId(1L);
        db1.setName("Workspace 1");
        db1.setTenantId("tenant_1");
        db1.setLayoutConfig("[]");

        when(dashboardRepository.findByTenantId("tenant_1")).thenReturn(List.of(db1));

        ResponseEntity<List<DashboardConfig>> response = dashboardController.getAllDashboards();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Workspace 1", response.getBody().get(0).getName());
    }

    @Test
    public void testGetDashboardById() {
        DashboardConfig db1 = new DashboardConfig();
        db1.setId(1L);
        db1.setName("Workspace 1");
        db1.setTenantId("tenant_1");

        when(dashboardRepository.findByIdAndTenantId(1L, "tenant_1")).thenReturn(Optional.of(db1));

        ResponseEntity<?> response = dashboardController.getDashboardById(1L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof DashboardConfig);
        assertEquals("Workspace 1", ((DashboardConfig) response.getBody()).getName());
    }

    @Test
    public void testCreateDashboard() {
        DashboardConfig db = new DashboardConfig();
        db.setId(10L);
        db.setName("New Workspace");
        db.setTenantId("tenant_1");
        db.setLayoutConfig("[{\"id\":\"kpi_1\"}]");

        when(dashboardRepository.save(any(DashboardConfig.class))).thenReturn(db);

        Map<String, String> request = Map.of("name", "New Workspace", "layoutConfig", "[{\"id\":\"kpi_1\"}]");
        ResponseEntity<?> response = dashboardController.createDashboard(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof DashboardConfig);
        assertEquals("New Workspace", ((DashboardConfig) response.getBody()).getName());
    }

    @Test
    public void testSaveWorkspace_CreateNew() {
        DashboardConfig saved = new DashboardConfig();
        saved.setId(20L);
        saved.setName("Saved Workspace");
        saved.setTenantId("tenant_1");
        saved.setLayoutConfig("[{\"type\":\"chart\"}]");

        when(dashboardRepository.save(any(DashboardConfig.class))).thenReturn(saved);

        Map<String, Object> request = new HashMap<>();
        request.put("name", "Saved Workspace");
        request.put("layoutConfig", "[{\"type\":\"chart\"}]");

        ResponseEntity<?> response = dashboardController.saveWorkspace(request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        DashboardConfig result = (DashboardConfig) response.getBody();
        assertNotNull(result);
        assertEquals(20L, result.getId());
        assertEquals("Saved Workspace", result.getName());
    }

    @Test
    public void testSaveWorkspace_UpdateExisting() {
        DashboardConfig existing = new DashboardConfig();
        existing.setId(30L);
        existing.setName("Existing Workspace");
        existing.setTenantId("tenant_1");
        existing.setLayoutConfig("[]");

        when(dashboardRepository.findByIdAndTenantId(30L, "tenant_1")).thenReturn(Optional.of(existing));
        when(dashboardRepository.save(any(DashboardConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> request = new HashMap<>();
        request.put("id", 30L);
        request.put("name", "Updated Workspace Name");
        request.put("layoutConfig", "[{\"type\":\"table\"}]");

        ResponseEntity<?> response = dashboardController.saveWorkspace(request);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        DashboardConfig result = (DashboardConfig) response.getBody();
        assertNotNull(result);
        assertEquals("Updated Workspace Name", result.getName());
        assertEquals("[{\"type\":\"table\"}]", result.getLayoutConfig());
    }

    @Test
    public void testDeleteDashboard() {
        DashboardConfig existing = new DashboardConfig();
        existing.setId(40L);
        existing.setName("To Delete");
        existing.setTenantId("tenant_1");

        when(dashboardRepository.findByIdAndTenantId(40L, "tenant_1")).thenReturn(Optional.of(existing));
        doNothing().when(dashboardRepository).delete(existing);

        ResponseEntity<?> response = dashboardController.deleteDashboard(40L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(dashboardRepository, times(1)).delete(existing);
    }
}
