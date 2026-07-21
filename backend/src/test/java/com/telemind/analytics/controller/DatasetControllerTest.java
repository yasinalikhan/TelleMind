package com.telemind.analytics.controller;

import com.telemind.analytics.model.CustomDataset;
import com.telemind.analytics.repository.CustomDatasetRepository;
import com.telemind.analytics.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class DatasetControllerTest {

    @Autowired
    private DatasetController datasetController;

    @Autowired
    private CustomDatasetRepository customDatasetRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setup() {
        TenantContext.setCurrentTenant("tenant_test");
    }

    @AfterEach
    public void tearDown() {
        List<CustomDataset> datasets = customDatasetRepository.findByTenantId("tenant_test");
        for (CustomDataset ds : datasets) {
            datasetController.deleteDataset(ds.getId());
        }
        TenantContext.clear();
    }

    @Test
    public void testUploadAndInferSchema() throws Exception {
        String csvContent = "Item Name,Quantity,Price,Sale Date\n" +
                "Laptop,5,1200.50,2026-07-01\n" +
                "Mouse,50,25.00,2026-07-02\n" +
                "Keyboard,20,75.25,2026-07-03\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sales-data.csv",
                "text/csv",
                csvContent.getBytes()
        );

        ResponseEntity<?> response = datasetController.uploadDataset(file);
        assertEquals(200, response.getStatusCode().value());

        CustomDataset ds = (CustomDataset) response.getBody();
        assertNotNull(ds);
        assertEquals("sales_data", ds.getTableName());
        assertEquals("sales-data.csv", ds.getOriginalFilename());
        assertEquals(3, ds.getRowCount());

        // Verify Schema Json
        assertTrue(ds.getSchemaJson().contains("\"item_name\":\"VARCHAR(255)\""));
        assertTrue(ds.getSchemaJson().contains("\"quantity\":\"INTEGER\""));
        assertTrue(ds.getSchemaJson().contains("\"price\":\"NUMERIC\""));
        assertTrue(ds.getSchemaJson().contains("\"sale_date\":\"DATE\""));

        // Verify dynamic table exists and has correct columns
        String fullTableName = "ds_tenant_test_sales_data";
        Integer rowCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + fullTableName, Integer.class);
        assertEquals(3, rowCount);

        // Verify content and tenant_id column
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + fullTableName);
        assertEquals(3, rows.size());
        assertEquals("Laptop", rows.get(0).get("item_name"));
        assertEquals(5, ((Number) rows.get(0).get("quantity")).intValue());
        assertEquals("tenant_test", rows.get(0).get("tenant_id"));
    }
}
