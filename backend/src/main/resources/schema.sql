-- Subscriber Table
DROP TABLE IF EXISTS usage;
DROP TABLE IF EXISTS revenue;
DROP TABLE IF EXISTS subscriber;

CREATE TABLE subscriber (
    id INT AUTO_INCREMENT PRIMARY KEY,
    msisdn VARCHAR(20) NOT NULL,
    region VARCHAR(50) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    recharge_amount DECIMAL(10, 2) NOT NULL,
    signup_date DATE NOT NULL,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'tenant_default'
);

-- Revenue Table
CREATE TABLE revenue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    region VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'tenant_default'
);

-- Usage Table
CREATE TABLE usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tower VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    data_mb DECIMAL(12, 2) NOT NULL,
    voice_minutes INT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'tenant_default'
);

-- Saved Queries Table
CREATE TABLE IF NOT EXISTS saved_queries (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    query_text TEXT NOT NULL,
    query_type VARCHAR(20) NOT NULL DEFAULT 'SQL',
    description VARCHAR(255),
    category VARCHAR(50) DEFAULT 'General',
    chart_type VARCHAR(50),
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Telecom KPIs Table
CREATE TABLE IF NOT EXISTS telecom_kpis (
    id BIGSERIAL PRIMARY KEY,
    kpi_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    metric_value DECIMAL(12, 2) NOT NULL,
    target_value DECIMAL(12, 2) NOT NULL,
    poor_threshold DECIMAL(12, 2),
    fair_threshold DECIMAL(12, 2),
    good_threshold DECIMAL(12, 2),
    unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Normal',
    recorded_date DATE NOT NULL,
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'tenant_1'
);

-- Dashboard Configs Table (Persistent Workspaces)
CREATE TABLE IF NOT EXISTS dashboard_config (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    layout_config TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Custom Datasets Table
CREATE TABLE IF NOT EXISTS custom_datasets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    description TEXT,
    row_count INT NOT NULL DEFAULT 0,
    schema_json TEXT NOT NULL,
    sample_data TEXT NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL
);
