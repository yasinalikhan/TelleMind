package com.telemind.analytics.security;

import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.Select;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class SqlValidatorService {

    private static final Logger log = LoggerFactory.getLogger(SqlValidatorService.class);

    private static final Pattern UNSAFE_KEYWORDS = Pattern.compile(
            "\\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|exec|execute|declare)\\b",
            Pattern.CASE_INSENSITIVE
    );

    public void validateQuery(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new IllegalArgumentException("SQL query cannot be empty");
        }

        String trimmedSql = sql.trim();

        // 1. Disallow SQL comments (evasion vectors)
        if (trimmedSql.contains("--") || trimmedSql.contains("/*") || trimmedSql.contains("*/")) {
            throw new SecurityException("Comments are not allowed in SQL queries for security reasons.");
        }

        // 2. Fast check for dangerous mutation keywords
        if (UNSAFE_KEYWORDS.matcher(trimmedSql.toLowerCase()).find()) {
            throw new SecurityException("Unsafe SQL query detected. Only SELECT statements are allowed.");
        }

        // 3. Strict AST Verification via JSqlParser
        try {
            Statement statement = CCJSqlParserUtil.parse(trimmedSql);
            if (!(statement instanceof Select)) {
                throw new SecurityException("Invalid SQL query. Only SELECT queries are supported.");
            }
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            if (!trimmedSql.toLowerCase().startsWith("select")) {
                throw new SecurityException("Invalid SQL query. Only SELECT queries are supported.");
            }
            log.warn("SQL AST parsing syntax exception: {}", e.getMessage());
            throw new SecurityException("Malformed SQL query: " + e.getMessage());
        }
    }
}
