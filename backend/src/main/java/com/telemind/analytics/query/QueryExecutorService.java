package com.telemind.analytics.query;

import com.telemind.analytics.security.SqlValidatorService;
import com.telemind.analytics.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class QueryExecutorService {

    private static final Logger log = LoggerFactory.getLogger(QueryExecutorService.class);

    private final JdbcTemplate jdbcTemplate;
    private final SqlValidatorService sqlValidatorService;

    public QueryExecutorService(JdbcTemplate jdbcTemplate, SqlValidatorService sqlValidatorService) {
        this.jdbcTemplate = jdbcTemplate;
        this.sqlValidatorService = sqlValidatorService;
    }

    public List<Map<String, Object>> executeQuery(String rawSql) {
        // 1. Validate SQL to prevent SQL injection and unsafe commands
        sqlValidatorService.validateQuery(rawSql);

        // 2. Resolve the current tenant
        String tenantId = TenantContext.getCurrentTenant();
        log.info("Executing query for Tenant: {}", tenantId);

        // 3. Inject Tenant filter dynamically
        String securedSql = injectTenantFilter(rawSql, tenantId);
        log.info("Secured SQL: {}", securedSql);

        // 4. Run query
        return jdbcTemplate.queryForList(securedSql);
    }

    /**
     * Dynamically injects tenant filter into the SQL SELECT query.
     * Handles simple queries, group by, order by, and limit clauses.
     */
    public String injectTenantFilter(String sql, String tenantId) {
        String trimmed = sql.trim();
        String lower = trimmed.toLowerCase();

        // If the query already has tenant_id checked, don't double inject
        if (lower.contains("tenant_id")) {
            return trimmed;
        }

        // Determine where to inject the WHERE clause or how to append it
        String tenantCondition = "tenant_id = '" + tenantId + "'";

        // Find standard parts of query to place tenant filter before them
        int orderIdx = lower.indexOf("order by");
        int groupIdx = lower.indexOf("group by");
        int limitIdx = lower.indexOf("limit");
        
        int insertBeforeIdx = -1;
        if (groupIdx != -1) {
            insertBeforeIdx = groupIdx;
        } else if (orderIdx != -1) {
            insertBeforeIdx = orderIdx;
        } else if (limitIdx != -1) {
            insertBeforeIdx = limitIdx;
        }

        int whereIdx = lower.indexOf("where");

        if (whereIdx != -1) {
            // WHERE clause exists, insert: AND tenant_id = 'tenantId'
            if (insertBeforeIdx != -1) {
                String beforeInsert = trimmed.substring(0, insertBeforeIdx).trim();
                String afterInsert = trimmed.substring(insertBeforeIdx);
                return beforeInsert + " AND " + tenantCondition + " " + afterInsert;
            } else {
                return trimmed + " AND " + tenantCondition;
            }
        } else {
            // No WHERE clause, insert: WHERE tenant_id = 'tenantId'
            if (insertBeforeIdx != -1) {
                String beforeInsert = trimmed.substring(0, insertBeforeIdx).trim();
                String afterInsert = trimmed.substring(insertBeforeIdx);
                return beforeInsert + " WHERE " + tenantCondition + " " + afterInsert;
            } else {
                return trimmed + " WHERE " + tenantCondition;
            }
        }
    }
}
