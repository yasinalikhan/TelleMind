-- Seed Subscribers
INSERT INTO subscriber (msisdn, region, plan, status, recharge_amount, signup_date, tenant_id) VALUES
('+93799000101', 'Kabul', 'Postpaid Unlimited', 'Active', 1500.00, '2025-01-15', 'tenant_1'),
('+93799000102', 'Kabul', 'Prepaid Monthly', 'Active', 500.00, '2025-02-20', 'tenant_1'),
('+93799000103', 'Herat', 'Prepaid Monthly', 'Active', 350.00, '2025-03-10', 'tenant_1'),
('+93799000104', 'Herat', 'Prepaid Daily', 'Inactive', 50.00, '2025-04-05', 'tenant_1'),
('+93799000105', 'Mazar-e-Sharif', 'Postpaid Corporate', 'Active', 2500.00, '2024-11-12', 'tenant_1'),
('+93799000106', 'Mazar-e-Sharif', 'Prepaid Monthly', 'Active', 450.00, '2025-05-18', 'tenant_1'),
('+93799000107', 'Kandahar', 'Postpaid Unlimited', 'Active', 1200.00, '2025-01-30', 'tenant_1'),
('+93799000108', 'Kandahar', 'Prepaid Daily', 'Inactive', 20.00, '2025-05-01', 'tenant_1'),
('+93799000109', 'Jalalabad', 'Prepaid Monthly', 'Active', 600.00, '2025-03-22', 'tenant_1'),
('+93799000110', 'Jalalabad', 'Postpaid Corporate', 'Active', 3000.00, '2024-09-05', 'tenant_1'),
('+93799000111', 'Kabul', 'Prepaid Daily', 'Inactive', 10.00, '2025-06-01', 'tenant_1'),
('+93799000112', 'Herat', 'Postpaid Corporate', 'Active', 2200.00, '2025-01-10', 'tenant_1'),
-- Seed for tenant_2 (isolation testing)
('+93700112233', 'Kabul', 'Prepaid Monthly', 'Active', 400.00, '2025-02-15', 'tenant_2');

-- Seed Daily Revenue (Last 30 Days trend)
-- We will write daily records from 2026-06-08 to 2026-07-08
INSERT INTO revenue (date, region, amount, category, tenant_id) VALUES
('2026-06-08', 'Kabul', 5200.00, 'Data', 'tenant_1'),
('2026-06-09', 'Kabul', 4900.00, 'Voice', 'tenant_1'),
('2026-06-10', 'Herat', 3200.00, 'Data', 'tenant_1'),
('2026-06-11', 'Mazar-e-Sharif', 4100.00, 'Data', 'tenant_1'),
('2026-06-12', 'Kandahar', 2900.00, 'Voice', 'tenant_1'),
('2026-06-13', 'Jalalabad', 3500.00, 'SMS', 'tenant_1'),
('2026-06-14', 'Kabul', 6100.00, 'Data', 'tenant_1'),
('2026-06-15', 'Herat', 3400.00, 'Voice', 'tenant_1'),
('2026-06-16', 'Mazar-e-Sharif', 4300.00, 'Data', 'tenant_1'),
('2026-06-17', 'Kandahar', 3100.00, 'Data', 'tenant_1'),
('2026-06-18', 'Jalalabad', 3800.00, 'Voice', 'tenant_1'),
('2026-06-19', 'Kabul', 5800.00, 'Data', 'tenant_1'),
('2026-06-20', 'Herat', 3900.00, 'SMS', 'tenant_1'),
('2026-06-21', 'Mazar-e-Sharif', 4600.00, 'Voice', 'tenant_1'),
('2026-06-22', 'Kandahar', 3300.00, 'Data', 'tenant_1'),
('2026-06-23', 'Jalalabad', 4000.00, 'Data', 'tenant_1'),
('2026-06-24', 'Kabul', 6500.00, 'Voice', 'tenant_1'),
('2026-06-25', 'Herat', 4100.00, 'Data', 'tenant_1'),
('2026-06-26', 'Mazar-e-Sharif', 4900.00, 'SMS', 'tenant_1'),
('2026-06-27', 'Kandahar', 3500.00, 'Voice', 'tenant_1'),
('2026-06-28', 'Jalalabad', 4200.00, 'Data', 'tenant_1'),
('2026-06-29', 'Kabul', 7100.00, 'Data', 'tenant_1'),
('2026-06-30', 'Herat', 4300.00, 'Voice', 'tenant_1'),
('2026-07-01', 'Mazar-e-Sharif', 5200.00, 'Data', 'tenant_1'),
('2026-07-02', 'Kandahar', 3800.00, 'SMS', 'tenant_1'),
('2026-07-03', 'Jalalabad', 4600.00, 'Voice', 'tenant_1'),
('2026-07-04', 'Kabul', 7500.00, 'Data', 'tenant_1'),
('2026-07-05', 'Herat', 4800.00, 'Data', 'tenant_1'),
('2026-07-06', 'Mazar-e-Sharif', 5600.00, 'Voice', 'tenant_1'),
('2026-07-07', 'Kandahar', 4100.00, 'Data', 'tenant_1'),
('2026-07-08', 'Jalalabad', 4900.00, 'Data', 'tenant_1'),
-- Seed for tenant_2 (isolation testing)
('2026-07-08', 'Kabul', 1500.00, 'Data', 'tenant_2');

-- Seed Network Usage (matrix for Heatmap/Geo Map)
INSERT INTO usage (tower, region, data_mb, voice_minutes, timestamp, tenant_id) VALUES
('KBL-TWR-01', 'Kabul', 12500.45, 1450, '2026-07-08 10:00:00', 'tenant_1'),
('KBL-TWR-02', 'Kabul', 18900.80, 2100, '2026-07-08 10:00:00', 'tenant_1'),
('KBL-TWR-03', 'Kabul', 9800.20, 1100, '2026-07-08 10:00:00', 'tenant_1'),
('HRT-TWR-01', 'Herat', 8700.50, 950, '2026-07-08 10:00:00', 'tenant_1'),
('HRT-TWR-02', 'Herat', 11200.60, 1300, '2026-07-08 10:00:00', 'tenant_1'),
('MZR-TWR-01', 'Mazar-e-Sharif', 7500.25, 820, '2026-07-08 10:00:00', 'tenant_1'),
('MZR-TWR-02', 'Mazar-e-Sharif', 14300.90, 1650, '2026-07-08 10:00:00', 'tenant_1'),
('KDH-TWR-01', 'Kandahar', 6800.10, 710, '2026-07-08 10:00:00', 'tenant_1'),
('KDH-TWR-02', 'Kandahar', 8900.40, 980, '2026-07-08 10:00:00', 'tenant_1'),
('JLD-TWR-01', 'Jalalabad', 9100.80, 1020, '2026-07-08 10:00:00', 'tenant_1'),
('JLD-TWR-02', 'Jalalabad', 5600.30, 600, '2026-07-08 10:00:00', 'tenant_1'),
-- Seed for tenant_2 (isolation testing)
('KBL-TWR-01', 'Kabul', 4500.00, 500, '2026-07-08 10:00:00', 'tenant_2');
