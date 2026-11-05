-- =============================================================
-- V5: Saved Queries and Telecom KPIs & Analytics Dataset
-- =============================================================

-- 1. Saved Queries Table
CREATE TABLE IF NOT EXISTS saved_queries (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(150) NOT NULL,
    query_text      TEXT NOT NULL,
    query_type      VARCHAR(20) NOT NULL DEFAULT 'SQL', -- 'SQL' or 'NATURAL_LANGUAGE'
    description     VARCHAR(255),
    category        VARCHAR(50) DEFAULT 'General',
    chart_type      VARCHAR(50),
    tenant_id       VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_queries_tenant ON saved_queries(tenant_id);

-- 2. Telecom Operational KPIs Table (supporting all 20 charts & gauge/bullet/sparkline)
CREATE TABLE IF NOT EXISTS telecom_kpis (
    id              BIGSERIAL PRIMARY KEY,
    kpi_name        VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL, -- 'SLA', 'Throughput', 'Revenue', 'Customer', 'Network'
    metric_value    DECIMAL(12, 2) NOT NULL,
    target_value    DECIMAL(12, 2) NOT NULL,
    poor_threshold  DECIMAL(12, 2),
    fair_threshold  DECIMAL(12, 2),
    good_threshold  DECIMAL(12, 2),
    unit            VARCHAR(20),
    status          VARCHAR(20) DEFAULT 'Normal',
    recorded_date   DATE NOT NULL,
    tenant_id       VARCHAR(50) NOT NULL DEFAULT 'tenant_1'
);

CREATE INDEX IF NOT EXISTS idx_telecom_kpis_tenant ON telecom_kpis(tenant_id);

-- 3. Seed initial Saved Queries
INSERT INTO saved_queries (title, query_text, query_type, description, category, chart_type, tenant_id) VALUES
('Daily Revenue Trajectory', 'SELECT date, SUM(amount) AS amount FROM revenue GROUP BY date ORDER BY date', 'SQL', '30-day revenue trendline across all telecom business units', 'Financial', 'line', 'tenant_1'),
('Regional Revenue Leaderboard', 'SELECT region, SUM(amount) AS amount FROM revenue GROUP BY region ORDER BY amount DESC', 'SQL', 'Total revenue generated per province ranking', 'Financial', 'bar', 'tenant_1'),
('Tariff Plan Market Share', 'SELECT plan, COUNT(*) AS count FROM subscriber GROUP BY plan ORDER BY count DESC', 'SQL', 'Subscriber percentage breakdown across tariff plans', 'Marketing', 'pie', 'tenant_1'),
('Tower Congestion Heatmap', 'SELECT region, tower, SUM(data_mb) AS data_mb FROM usage GROUP BY region, tower ORDER BY data_mb DESC', 'SQL', 'Cell tower throughput intensity matrix', 'Network', 'heatmap', 'tenant_1'),
('Top 10 High-Value Subscribers', 'SELECT msisdn, region, recharge_amount FROM subscriber ORDER BY recharge_amount DESC LIMIT 10', 'SQL', 'Leaderboard of top spending VIP subscribers', 'Customer', 'horizontal_bar', 'tenant_1'),
('Network SLA Target Benchmarks', 'SELECT kpi_name, metric_value, target_value FROM telecom_kpis WHERE category = ''SLA'' ORDER BY kpi_name', 'SQL', 'Core network SLA performance against target thresholds', 'SLA', 'bullet', 'tenant_1'),
('Ask: Compare Data Usage By Region', 'Compare data usage by region', 'NATURAL_LANGUAGE', 'Natural language prompt for regional bandwidth distribution', 'Network', 'bar', 'tenant_1'),
('Ask: Display Google Map Base Stations', 'Display google map base stations', 'NATURAL_LANGUAGE', 'Geospatial visualization of cellular base stations', 'Geospatial', 'google-map', 'tenant_1')
ON CONFLICT DO NOTHING;

-- 4. Seed initial Telecom KPIs
INSERT INTO telecom_kpis (kpi_name, category, metric_value, target_value, poor_threshold, fair_threshold, good_threshold, unit, status, recorded_date, tenant_id) VALUES
('Core Network Availability', 'SLA', 99.85, 99.95, 98.00, 99.00, 99.90, '%', 'Healthy', '2026-07-08', 'tenant_1'),
('Call Drop Rate (CDR)', 'SLA', 0.42, 0.50, 1.50, 1.00, 0.50, '%', 'Optimal', '2026-07-08', 'tenant_1'),
('5G Peak Throughput', 'Throughput', 450.00, 500.00, 200.00, 350.00, 500.00, 'Mbps', 'Good', '2026-07-08', 'tenant_1'),
('Average Latency', 'Throughput', 24.50, 20.00, 50.00, 35.00, 20.00, 'ms', 'Good', '2026-07-08', 'tenant_1'),
('Packet Loss Ratio', 'Network', 0.12, 0.20, 1.00, 0.50, 0.20, '%', 'Optimal', '2026-07-08', 'tenant_1'),
('ARPU (Average Revenue)', 'Revenue', 14.80, 15.00, 10.00, 12.50, 15.00, '$', 'Meeting Target', '2026-07-08', 'tenant_1'),
('Customer Churn Rate', 'Customer', 1.85, 2.00, 4.00, 3.00, 2.00, '%', 'Good', '2026-07-08', 'tenant_1'),
('Base Station Uptime', 'SLA', 99.60, 99.90, 97.00, 98.50, 99.50, '%', 'Healthy', '2026-07-08', 'tenant_1')
ON CONFLICT DO NOTHING;
