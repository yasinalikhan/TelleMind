-- =============================================================
-- V6: Seed Default Dashboards / Workspaces (PostgreSQL)
-- Ensures initial workspaces always persist across restarts
-- =============================================================

INSERT INTO dashboard_config (name, tenant_id, layout_config, created_at, updated_at)
VALUES
(
    'Executive Telecom Operations & KPI Dashboard',
    'tenant_1',
    '[{"id":"comp_revenue_trend","type":"chart","props":{"chartType":"line","title":"Daily Revenue Trend (AFN)","xAxis":"date","yAxis":"amount","colSpan":6,"widgetHeight":340,"data":[{"date":"2026-06-08","amount":5200.00},{"date":"2026-06-15","amount":7400.00},{"date":"2026-06-22","amount":8300.00},{"date":"2026-06-29","amount":9100.00},{"date":"2026-07-08","amount":10500.00}]}},{"id":"comp_regional_rev","type":"chart","props":{"chartType":"bar","title":"Regional Revenue Comparison","xAxis":"region","yAxis":"amount","colSpan":6,"widgetHeight":340,"data":[{"region":"Kabul","amount":29800.00},{"region":"Herat","amount":18900.00},{"region":"Mazar-e-Sharif","amount":22500.00},{"region":"Jalalabad","amount":16400.00},{"region":"Kandahar","amount":14200.00}]}},{"id":"comp_traffic_mix","type":"chart","props":{"chartType":"stacked_bar","title":"Traffic Mix: Data (MB) vs Voice (Mins)","xAxis":"region","colSpan":6,"widgetHeight":340,"data":[{"region":"Kabul","data_mb":41200,"voice_minutes":4650},{"region":"Herat","data_mb":19900,"voice_minutes":2250},{"region":"Mazar-e-Sharif","data_mb":21800,"voice_minutes":2470},{"region":"Kandahar","data_mb":15700,"voice_minutes":1690},{"region":"Jalalabad","data_mb":14700,"voice_minutes":1620}]}},{"id":"comp_plan_share","type":"chart","props":{"chartType":"donut","title":"Subscriber Tariff Plan Share","labelKey":"plan","valueKey":"count","colSpan":6,"widgetHeight":340,"data":[{"plan":"Prepaid Monthly","count":450},{"plan":"Postpaid Unlimited","count":280},{"plan":"Postpaid Corporate","count":190},{"plan":"Prepaid Daily","count":120}]}},{"id":"comp_sla_gauge","type":"chart","props":{"chartType":"gauge","title":"Core SLA Network Health Target","valueKey":"value","colSpan":4,"widgetHeight":300,"data":[{"value":94.6}]}},{"id":"comp_radar_profile","type":"chart","props":{"chartType":"radar","title":"Operational Radar Assessment","colSpan":4,"widgetHeight":300,"data":[{"category":"Coverage","score":92},{"category":"Throughput","score":88},{"category":"Latency","score":95},{"category":"Voice Quality","score":90},{"category":"SLA Uptime","score":97}]}},{"id":"comp_sparkline_rev","type":"chart","props":{"chartType":"sparkline","title":"Weekly Revenue Velocity Scorecard","colSpan":4,"widgetHeight":300,"data":[{"day":"Mon","value":5200},{"day":"Tue","value":6100},{"day":"Wed","value":5800},{"day":"Thu","value":6500},{"day":"Fri","value":7100},{"day":"Sat","value":7500},{"day":"Sun","value":8200}]}}]',
    NOW(),
    NOW()
),
(
    'Network Infrastructure & Tower Telemetry',
    'tenant_1',
    '[{"id":"comp_tower_heat","type":"chart","props":{"chartType":"heatmap","title":"Cell Tower Congestion Matrix","colSpan":6,"widgetHeight":360,"data":[{"region":"Kabul","tower":"KBL-TWR-01","data_mb":12500},{"region":"Kabul","tower":"KBL-TWR-02","data_mb":18900},{"region":"Herat","tower":"HRT-TWR-01","data_mb":8700},{"region":"Mazar-e-Sharif","tower":"MZR-TWR-01","data_mb":7500}]}},{"id":"comp_sla_bullet","type":"chart","props":{"chartType":"bullet","title":"Core SLA Benchmark Bands","colSpan":6,"widgetHeight":360,"data":[{"kpi_name":"RAN Availability","metric_value":99.4,"target_value":99.9},{"kpi_name":"Packet Drop Rate","metric_value":0.4,"target_value":0.2}]}},{"id":"comp_traffic_sankey","type":"chart","props":{"chartType":"sankey","title":"Access to Core Network Routing Flow","colSpan":12,"widgetHeight":340,"data":[{"source":"Kabul Node","target":"Data Center 1","value":18000},{"source":"Herat Node","target":"Data Center 1","value":9500},{"source":"Mazar Node","target":"Data Center 2","value":8200}]}}]',
    NOW(),
    NOW()
),
(
    'Roshan Telecom Operations Overview',
    'tenant_2',
    '[{"id":"comp_roshan_rev","type":"chart","props":{"chartType":"bar","title":"Roshan Daily Revenue Distribution","xAxis":"region","yAxis":"amount","colSpan":6,"widgetHeight":340,"data":[{"region":"Kabul","amount":15000.00},{"region":"Herat","amount":9200.00},{"region":"Balkh","amount":8100.00}]}},{"id":"comp_roshan_sla","type":"chart","props":{"chartType":"gauge","title":"Roshan Network SLA Target","valueKey":"value","colSpan":6,"widgetHeight":340,"data":[{"value":96.2}]}}]',
    NOW(),
    NOW()
);
