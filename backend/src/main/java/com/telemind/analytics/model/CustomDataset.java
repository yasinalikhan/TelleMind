package com.telemind.analytics.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_datasets")
public class CustomDataset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_name", nullable = false)
    private String tableName;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "row_count", nullable = false)
    private Integer rowCount = 0;

    @Column(name = "schema_json", nullable = false, columnDefinition = "TEXT")
    private String schemaJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public Integer getRowCount() { return rowCount; }
    public void setRowCount(Integer rowCount) { this.rowCount = rowCount; }

    public String getSchemaJson() { return schemaJson; }
    public void setSchemaJson(String schemaJson) { this.schemaJson = schemaJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
