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

-- Seed Default Dashboards / Workspaces
INSERT INTO dashboard_config (name, tenant_id, layout_config, created_at, updated_at) VALUES
('Executive Telecom Operations & KPI Dashboard', 'tenant_1', '[{"id":"comp_revenue_trend","type":"chart","props":{"chartType":"line","title":"Daily Revenue Trend (AFN)","xAxis":"date","yAxis":"amount","colSpan":6,"widgetHeight":340,"data":[{"date":"2026-06-08","amount":5200.00},{"date":"2026-06-15","amount":7400.00},{"date":"2026-06-22","amount":8300.00},{"date":"2026-06-29","amount":9100.00},{"date":"2026-07-08","amount":10500.00}]}},{"id":"comp_regional_rev","type":"chart","props":{"chartType":"bar","title":"Regional Revenue Comparison","xAxis":"region","yAxis":"amount","colSpan":6,"widgetHeight":340,"data":[{"region":"Kabul","amount":29800.00},{"region":"Herat","amount":18900.00},{"region":"Mazar-e-Sharif","amount":22500.00},{"region":"Jalalabad","amount":16400.00},{"region":"Kandahar","amount":14200.00}]}},{"id":"comp_traffic_mix","type":"chart","props":{"chartType":"stacked_bar","title":"Traffic Mix: Data (MB) vs Voice (Mins)","xAxis":"region","colSpan":6,"widgetHeight":340,"data":[{"region":"Kabul","data_mb":41200,"voice_minutes":4650},{"region":"Herat","data_mb":19900,"voice_minutes":2250},{"region":"Mazar-e-Sharif","data_mb":21800,"voice_minutes":2470},{"region":"Kandahar","data_mb":15700,"voice_minutes":1690},{"region":"Jalalabad","data_mb":14700,"voice_minutes":1620}]}},{"id":"comp_plan_share","type":"chart","props":{"chartType":"donut","title":"Subscriber Tariff Plan Share","labelKey":"plan","valueKey":"count","colSpan":6,"widgetHeight":340,"data":[{"plan":"Prepaid Monthly","count":450},{"plan":"Postpaid Unlimited","count":280},{"plan":"Postpaid Corporate","count":190},{"plan":"Prepaid Daily","count":120}]}},{"id":"comp_sla_gauge","type":"chart","props":{"chartType":"gauge","title":"Core SLA Network Health Target","valueKey":"value","colSpan":4,"widgetHeight":300,"data":[{"value":94.6}]}},{"id":"comp_radar_profile","type":"chart","props":{"chartType":"radar","title":"Operational Radar Assessment","colSpan":4,"widgetHeight":300,"data":[{"category":"Coverage","score":92},{"category":"Throughput","score":88},{"category":"Latency","score":95},{"category":"Voice Quality","score":90},{"category":"SLA Uptime","score":97}]}},{"id":"comp_sparkline_rev","type":"chart","props":{"chartType":"sparkline","title":"Weekly Revenue Velocity Scorecard","colSpan":4,"widgetHeight":300,"data":[{"day":"Mon","value":5200},{"day":"Tue","value":6100},{"day":"Wed","value":5800},{"day":"Thu","value":6500},{"day":"Fri","value":7100},{"day":"Sat","value":7500},{"day":"Sun","value":8200}]}}]', NOW(), NOW()),
('Network Infrastructure & Tower Telemetry', 'tenant_1', '[{"id":"comp_tower_heat","type":"chart","props":{"chartType":"heatmap","title":"Cell Tower Congestion Matrix","colSpan":6,"widgetHeight":360,"data":[{"region":"Kabul","tower":"KBL-TWR-01","data_mb":12500},{"region":"Kabul","tower":"KBL-TWR-02","data_mb":18900},{"region":"Herat","tower":"HRT-TWR-01","data_mb":8700},{"region":"Mazar-e-Sharif","tower":"MZR-TWR-01","data_mb":7500}]}},{"id":"comp_sla_bullet","type":"chart","props":{"chartType":"bullet","title":"Core SLA Benchmark Bands","colSpan":6,"widgetHeight":360,"data":[{"kpi_name":"RAN Availability","metric_value":99.4,"target_value":99.9},{"kpi_name":"Packet Drop Rate","metric_value":0.4,"target_value":0.2}]}},{"id":"comp_traffic_sankey","type":"chart","props":{"chartType":"sankey","title":"Access to Core Network Routing Flow","colSpan":12,"widgetHeight":340,"data":[{"source":"Kabul Node","target":"Data Center 1","value":18000},{"source":"Herat Node","target":"Data Center 1","value":9500},{"source":"Mazar Node","target":"Data Center 2","value":8200}]}}]', NOW(), NOW());
