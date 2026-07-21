CREATE TABLE custom_datasets (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    schema_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_table UNIQUE (tenant_id, table_name)
);
