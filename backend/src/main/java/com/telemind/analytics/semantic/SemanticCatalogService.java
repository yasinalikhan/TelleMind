package com.telemind.analytics.semantic;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Headless Telecom Semantic Layer & Metric Store.
 * Governs certified metric formulas, dimensions, and semantic translation
 * to eliminate LLM arithmetic hallucinations and ensure cross-tenant metric consistency.
 */
@Service
public class SemanticCatalogService {

    private static final Logger log = LoggerFactory.getLogger(SemanticCatalogService.class);

    private final Map<String, MetricDefinition> certifiedMetrics = new LinkedHashMap<>();
    private final Map<String, DimensionDefinition> dimensions = new LinkedHashMap<>();
    private final Map<String, Map<String, MetricDefinition>> tenantCustomMetrics = new ConcurrentHashMap<>();

    public SemanticCatalogService() {
        initDefaultDimensions();
        initDefaultMetrics();
        log.info("Initialized Telecom Semantic Layer with {} certified metrics and {} dimensions",
                certifiedMetrics.size(), dimensions.size());
    }

    private void initDefaultDimensions() {
        registerDimension(new DimensionDefinition("region", "Geographic Region / Circle", "region", "subscriber", DimensionDefinition.DimensionType.GEOGRAPHIC, List.of("Kabul", "Herat", "Mazar", "Kandahar", "Jalalabad")));
        registerDimension(new DimensionDefinition("plan", "Subscriber Tariff Plan", "plan", "subscriber", DimensionDefinition.DimensionType.CATEGORICAL, List.of("Prepaid Standard", "Postpaid VIP", "Unlimited 5G", "Data Booster")));
        registerDimension(new DimensionDefinition("status", "Subscriber Lifecycle Status", "status", "subscriber", DimensionDefinition.DimensionType.CATEGORICAL, List.of("Active", "Inactive", "Suspended", "Churned")));
        registerDimension(new DimensionDefinition("tower", "Cell Tower / Base Station", "tower", "usage", DimensionDefinition.DimensionType.CATEGORICAL, List.of("KBL-01", "KBL-02", "HRT-01", "MZR-01", "KDH-01")));
        registerDimension(new DimensionDefinition("date", "Billing & Transaction Date", "date", "revenue", DimensionDefinition.DimensionType.TEMPORAL, List.of("Daily", "Weekly", "Monthly")));
        registerDimension(new DimensionDefinition("category", "Revenue Stream Category", "category", "revenue", DimensionDefinition.DimensionType.CATEGORICAL, List.of("Data Recharge", "Voice Topup", "Roaming", "VAS Bundles")));
    }

    private void initDefaultMetrics() {
        // 1. ARPU (Average Revenue Per User)
        registerMetric(new MetricDefinition(
                "arpu",
                "ARPU (Average Revenue Per User)",
                MetricCategory.FINANCIAL,
                "Average revenue generated per subscriber in the selected period",
                "ROUND(AVG(recharge_amount), 2)",
                "subscriber",
                List.of("region", "plan", "status"),
                MetricUnit.CURRENCY,
                15.0,
                List.of("arpu", "average revenue per user", "average recharge", "revenue per subscriber", "avg revenue")
        ));

        // 2. Churn Rate
        registerMetric(new MetricDefinition(
                "churn_rate",
                "Subscriber Churn Rate (%)",
                MetricCategory.SUBSCRIBER_LIFECYCLE,
                "Percentage of inactive or terminated subscribers over total base",
                "ROUND(100.0 * COUNT(CASE WHEN status = 'Inactive' THEN 1 END) / NULLIF(COUNT(*), 0), 2)",
                "subscriber",
                List.of("region", "plan"),
                MetricUnit.PERCENTAGE,
                3.5,
                List.of("churn", "churn rate", "attrition", "lost subscribers", "churn percentage", "inactive rate")
        ));

        // 3. Retention Rate
        registerMetric(new MetricDefinition(
                "retention_rate",
                "Subscriber Retention Rate (%)",
                MetricCategory.SUBSCRIBER_LIFECYCLE,
                "Percentage of active paying subscribers retained",
                "ROUND(100.0 * COUNT(CASE WHEN status = 'Active' THEN 1 END) / NULLIF(COUNT(*), 0), 2)",
                "subscriber",
                List.of("region", "plan"),
                MetricUnit.PERCENTAGE,
                95.0,
                List.of("retention", "retention rate", "active subscriber percentage", "loyalty")
        ));

        // 4. MOU (Minutes of Usage)
        registerMetric(new MetricDefinition(
                "mou",
                "MOU (Minutes of Usage per Session/Tower)",
                MetricCategory.USAGE_VOLUME,
                "Average voice minutes per connection/tower record",
                "ROUND(AVG(voice_minutes), 1)",
                "usage",
                List.of("region", "tower"),
                MetricUnit.MINUTES,
                25.0,
                List.of("mou", "minutes of usage", "voice minutes", "call duration", "avg call time")
        ));

        // 5. Total Data Traffic in GB
        registerMetric(new MetricDefinition(
                "data_traffic_gb",
                "Total Data Traffic (GB)",
                MetricCategory.USAGE_VOLUME,
                "Total volume of cellular data consumed, converted to Gigabytes",
                "ROUND(SUM(data_mb) / 1024.0, 2)",
                "usage",
                List.of("region", "tower"),
                MetricUnit.GIGABYTES,
                10000.0,
                List.of("data in gb", "data traffic", "bandwidth in gb", "gb consumed", "total data gb", "data volume gb")
        ));

        // 6. Total Revenue
        registerMetric(new MetricDefinition(
                "total_revenue",
                "Total Gross Revenue",
                MetricCategory.FINANCIAL,
                "Total monetary revenue billed across all streams",
                "SUM(amount)",
                "revenue",
                List.of("region", "category", "date"),
                MetricUnit.CURRENCY,
                500000.0,
                List.of("total revenue", "gross revenue", "total billing", "overall revenue", "sales revenue")
        ));

        // 7. Active Subscribers
        registerMetric(new MetricDefinition(
                "active_subscribers",
                "Active Subscriber Count",
                MetricCategory.SUBSCRIBER_LIFECYCLE,
                "Total count of currently active subscribers",
                "COUNT(CASE WHEN status = 'Active' THEN 1 END)",
                "subscriber",
                List.of("region", "plan"),
                MetricUnit.COUNT,
                100000.0,
                List.of("active subscribers", "active users", "active sim cards", "current subscribers")
        ));

        // 8. Tower Traffic Density
        registerMetric(new MetricDefinition(
                "tower_traffic_density",
                "Tower Traffic Density (MB/Session)",
                MetricCategory.NETWORK_QOS,
                "Average data throughput load per tower logging event",
                "ROUND(AVG(data_mb), 2)",
                "usage",
                List.of("region", "tower"),
                MetricUnit.MEGABYTES,
                500.0,
                List.of("tower density", "tower load", "cell congestion", "tower throughput", "avg tower data")
        ));
    }

    public void registerMetric(MetricDefinition metric) {
        certifiedMetrics.put(metric.id(), metric);
    }

    public void registerDimension(DimensionDefinition dimension) {
        dimensions.put(dimension.name(), dimension);
    }

    public Collection<MetricDefinition> getAllMetrics() {
        return Collections.unmodifiableCollection(certifiedMetrics.values());
    }

    public Collection<DimensionDefinition> getAllDimensions() {
        return Collections.unmodifiableCollection(dimensions.values());
    }

    public Optional<MetricDefinition> getMetric(String id) {
        return Optional.ofNullable(certifiedMetrics.get(id));
    }

    public Optional<DimensionDefinition> getDimension(String name) {
        return Optional.ofNullable(dimensions.get(name));
    }

    /**
     * Builds the Semantic Metric Layer prompt injection for AI models.
     */
    public String getCertifiedMetricsPrompt() {
        StringBuilder sb = new StringBuilder();
        sb.append("\nCERTIFIED TELECOM SEMANTIC METRICS (MANDATORY DEFINITIONS - NEVER INVENT FORMULAS):\n");
        for (MetricDefinition m : certifiedMetrics.values()) {
            sb.append(String.format("  * %s (%s): %s FROM %s [Unit: %s, Dimensions: %s]\n",
                    m.id(), m.displayName(), m.sqlFormula(), m.baseTable(), m.unit().getLabel(),
                    String.join(", ", m.compatibleDimensions())));
        }
        sb.append("CRITICAL SEMANTIC RULE: When user asks for ARPU, Churn Rate, MOU, or Data GB, ALWAYS use the certified formula above with the correct GROUP BY.\n");
        return sb.toString();
    }

    /**
     * Resolves natural language questions into certified metric SQL queries.
     * Returns an Optional SQL query if a certified metric and dimension are detected.
     */
    public Optional<String> resolveSemanticQuery(String question) {
        String q = question.toLowerCase().trim();

        // Find best matching metric
        MetricDefinition matchedMetric = null;
        for (MetricDefinition metric : certifiedMetrics.values()) {
            for (String kw : metric.keywords()) {
                if (q.contains(kw)) {
                    matchedMetric = metric;
                    break;
                }
            }
            if (matchedMetric != null) break;
        }

        if (matchedMetric == null) {
            return Optional.empty();
        }

        // Find dimension (e.g. "by region", "by plan", "by tower", "by date", "by category")
        String matchedDimension = null;
        for (String dimName : matchedMetric.compatibleDimensions()) {
            if (q.contains("by " + dimName) || q.contains("per " + dimName) || q.contains("across " + dimName)) {
                matchedDimension = dimName;
                break;
            }
        }

        // If no explicit "by", check if dimension keyword is mentioned
        if (matchedDimension == null) {
            for (String dimName : matchedMetric.compatibleDimensions()) {
                if (q.contains(dimName)) {
                    matchedDimension = dimName;
                    break;
                }
            }
        }

        if (matchedDimension != null) {
            String sql = String.format("SELECT %s, %s AS %s FROM %s GROUP BY %s ORDER BY %s DESC",
                    matchedDimension,
                    matchedMetric.sqlFormula(),
                    matchedMetric.id(),
                    matchedMetric.baseTable(),
                    matchedDimension,
                    matchedMetric.id());
            log.info("Resolved semantic query for '{}' -> Metric: {}, Dimension: {} -> SQL: {}",
                    question, matchedMetric.id(), matchedDimension, sql);
            return Optional.of(sql);
        } else {
            // Aggregate query without grouping (KPI)
            String sql = String.format("SELECT %s AS %s FROM %s",
                    matchedMetric.sqlFormula(),
                    matchedMetric.id(),
                    matchedMetric.baseTable());
            log.info("Resolved semantic aggregate query for '{}' -> Metric: {} -> SQL: {}",
                    question, matchedMetric.id(), sql);
            return Optional.of(sql);
        }
    }
}
