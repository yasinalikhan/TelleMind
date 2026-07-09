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
