-- =============================================================
-- V1: Create Schema (PostgreSQL)
-- =============================================================

-- Users table for real authentication
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'ROLE_VIEWER',
    tenant_id   VARCHAR(50)  NOT NULL,
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Subscriber Table
CREATE TABLE IF NOT EXISTS subscriber (
    id              BIGSERIAL PRIMARY KEY,
    msisdn          VARCHAR(20)     NOT NULL,
    region          VARCHAR(50)     NOT NULL,
    plan            VARCHAR(50)     NOT NULL,
    status          VARCHAR(20)     NOT NULL,
    recharge_amount DECIMAL(10, 2)  NOT NULL,
    signup_date     DATE            NOT NULL,
    tenant_id       VARCHAR(50)     NOT NULL DEFAULT 'tenant_default'
);

-- Revenue Table
CREATE TABLE IF NOT EXISTS revenue (
    id          BIGSERIAL PRIMARY KEY,
    date        DATE            NOT NULL,
    region      VARCHAR(50)     NOT NULL,
    amount      DECIMAL(15, 2)  NOT NULL,
    category    VARCHAR(50)     NOT NULL,
    tenant_id   VARCHAR(50)     NOT NULL DEFAULT 'tenant_default'
);

-- Network Usage Table
CREATE TABLE IF NOT EXISTS usage (
    id              BIGSERIAL PRIMARY KEY,
    tower           VARCHAR(50)     NOT NULL,
    region          VARCHAR(50)     NOT NULL,
    data_mb         DECIMAL(12, 2)  NOT NULL,
    voice_minutes   INT             NOT NULL,
    timestamp       TIMESTAMP       NOT NULL,
    tenant_id       VARCHAR(50)     NOT NULL DEFAULT 'tenant_default'
);

-- Indexes for tenant isolation performance
CREATE INDEX IF NOT EXISTS idx_subscriber_tenant ON subscriber(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tenant    ON revenue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date      ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_usage_tenant      ON usage(tenant_id);
