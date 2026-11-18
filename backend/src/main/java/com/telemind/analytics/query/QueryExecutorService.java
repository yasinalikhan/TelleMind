package com.telemind.analytics.query;

import com.telemind.analytics.security.SqlValidatorService;
import com.telemind.analytics.security.TenantContext;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.operators.conditional.AndExpression;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class QueryExecutorService {

    private static final Logger log = LoggerFactory.getLogger(QueryExecutorService.class);

    private final JdbcTemplate jdbcTemplate;
    private final SqlValidatorService sqlValidatorService;
    private final QueryCacheService queryCacheService;

    @Autowired
    public QueryExecutorService(
            JdbcTemplate jdbcTemplate,
            SqlValidatorService sqlValidatorService,
            QueryCacheService queryCacheService) {
        this.jdbcTemplate = jdbcTemplate;
        this.sqlValidatorService = sqlValidatorService;
        this.queryCacheService = queryCacheService;
    }

    public List<Map<String, Object>> executeQuery(String rawSql, Object... args) {
        // 1. Validate SQL to prevent SQL injection and unsafe commands
        sqlValidatorService.validateQuery(rawSql);

        // 2. Resolve the current tenant
        String tenantId = TenantContext.getCurrentTenant();
        log.info("Executing query for Tenant: {}", tenantId);

        // 3. Inject Tenant filter dynamically using AST
        String securedSql = injectTenantFilter(rawSql, tenantId);
        log.info("Secured SQL: {}", securedSql);

        // 4. Cache check (fast path)
        if (queryCacheService != null) {
            Optional<List<Map<String, Object>>> cached = queryCacheService.get(tenantId, securedSql, args);
            if (cached.isPresent()) {
                log.info("Cache HIT for tenant {} (query: {})", tenantId, securedSql);
                return cached.get();
            }
        }

        // 5. Run query on database
        List<Map<String, Object>> results;
        if (args != null && args.length > 0) {
            results = jdbcTemplate.queryForList(securedSql, args);
        } else {
            results = jdbcTemplate.queryForList(securedSql);
        }

        // 6. Cache store
        if (queryCacheService != null && results != null) {
            queryCacheService.put(tenantId, securedSql, args, results);
        }

        return results;
    }

    /**
     * Dynamically injects tenant filter into the SQL SELECT query using AST parsing (JSqlParser).
     * Handles simple queries, joins, unions, subqueries, group by, order by, and CTEs.
     */
    public String injectTenantFilter(String sql, String tenantId) {
        if (sql == null || sql.trim().isEmpty()) {
            return sql;
        }

        String trimmed = sql.trim();

        // 1. Pre-process LLM placeholder patterns into real tenant literals
        trimmed = trimmed
                .replaceAll("<tenant_id>", "'" + tenantId + "'")
                .replaceAll("\\{tenant_id\\}", "'" + tenantId + "'")
                .replaceAll(":tenant_id", "'" + tenantId + "'")
                .replaceAll("'<[^>]*tenant[^>]*>'", "'" + tenantId + "'")
                .replaceAll("<[^>]*tenant[^>]*>", "'" + tenantId + "'");

        // 2. Fast check: if the query already checks tenant_id, avoid redundant filter
        if (trimmed.toLowerCase().contains("tenant_id")) {
            return trimmed;
        }

        // 3. AST-based Injection using JSqlParser
        try {
            Statement statement = CCJSqlParserUtil.parse(trimmed);
            if (statement instanceof Select select) {
                // Apply tenant filter to with-items (CTEs)
                if (select.getWithItemsList() != null) {
                    for (WithItem withItem : select.getWithItemsList()) {
                        if (withItem.getSubSelect() != null && withItem.getSubSelect().getSelectBody() != null) {
                            applyTenantFilterToSelectBody(withItem.getSubSelect().getSelectBody(), tenantId);
                        }
                    }
                }

                // Apply to main select body
                if (select.getSelectBody() != null) {
                    applyTenantFilterToSelectBody(select.getSelectBody(), tenantId);
                }

                return select.toString();
            }
        } catch (Exception e) {
            log.warn("JSqlParser AST rewrite failed ({}), falling back to clause-aware injection: {}", 
                    e.getMessage(), trimmed);
        }

        // 4. Safe fallback for edge cases
        return fallbackInjectTenantFilter(trimmed, tenantId);
    }

    private void applyTenantFilterToSelectBody(SelectBody selectBody, String tenantId) {
        if (selectBody instanceof PlainSelect plainSelect) {
            applyTenantFilterToPlainSelect(plainSelect, tenantId);
        } else if (selectBody instanceof SetOperationList setOpList) {
            if (setOpList.getSelects() != null) {
                for (SelectBody child : setOpList.getSelects()) {
                    applyTenantFilterToSelectBody(child, tenantId);
                }
            }
        }
    }

    private void applyTenantFilterToPlainSelect(PlainSelect plainSelect, String tenantId) {
        // Recursively handle subquery in FROM item
        FromItem fromItem = plainSelect.getFromItem();
        if (fromItem instanceof SubSelect subSelect && subSelect.getSelectBody() != null) {
            applyTenantFilterToSelectBody(subSelect.getSelectBody(), tenantId);
        }

        // Recursively handle subqueries in JOINs
        if (plainSelect.getJoins() != null) {
            for (Join join : plainSelect.getJoins()) {
                if (join.getRightItem() instanceof SubSelect subSelect && subSelect.getSelectBody() != null) {
                    applyTenantFilterToSelectBody(subSelect.getSelectBody(), tenantId);
                }
            }
        }

        // Check if where clause already contains tenant_id
        Expression existingWhere = plainSelect.getWhere();
        if (existingWhere != null && existingWhere.toString().toLowerCase().contains("tenant_id")) {
            return;
        }

        try {
            Expression tenantExpr = CCJSqlParserUtil.parseCondExpression("tenant_id = '" + tenantId + "'");
            if (existingWhere == null) {
                plainSelect.setWhere(tenantExpr);
            } else {
                plainSelect.setWhere(new AndExpression(existingWhere, tenantExpr));
            }
        } catch (Exception e) {
            log.error("Failed to append AST tenant condition: {}", e.getMessage(), e);
        }
    }

    /**
     * Clause-aware fallback for any non-standard dialect syntax
     */
    private String fallbackInjectTenantFilter(String trimmed, String tenantId) {
        String lower = trimmed.toLowerCase();
        if (lower.contains("tenant_id")) {
            return trimmed;
        }

        String tenantCondition = "tenant_id = '" + tenantId + "'";

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
            if (insertBeforeIdx != -1) {
                String beforeInsert = trimmed.substring(0, insertBeforeIdx).trim();
                String afterInsert = trimmed.substring(insertBeforeIdx);
                return beforeInsert + " AND " + tenantCondition + " " + afterInsert;
            } else {
                return trimmed + " AND " + tenantCondition;
            }
        } else {
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
