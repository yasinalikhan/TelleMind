-- =============================================================
-- V3: Create Dashboard Config Schema (PostgreSQL)
-- =============================================================

CREATE TABLE IF NOT EXISTS dashboard_config (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    tenant_id       VARCHAR(50) NOT NULL,
    layout_config   TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast tenant lookup
CREATE INDEX IF NOT EXISTS idx_dashboard_config_tenant ON dashboard_config(tenant_id);
