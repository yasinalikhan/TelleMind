package com.telemind.analytics.security;

import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

@Service
public class SqlValidatorService {

    private static final Pattern UNSAFE_SQL_PATTERN = Pattern.compile(
            "\\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|union|exec|execute|declare)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SELECT_PATTERN = Pattern.compile(
            "^\\s*select\\b",
            Pattern.CASE_INSENSITIVE
    );

    public void validateQuery(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new IllegalArgumentException("SQL query cannot be empty");
        }

        // Trim leading whitespaces/parentheses
        String trimmedSql = sql.trim().toLowerCase();

        // Check for unsafe keywords
        if (UNSAFE_SQL_PATTERN.matcher(trimmedSql).find()) {
            throw new SecurityException("Unsafe SQL query detected. Only SELECT statements are allowed.");
        }

        // Check if it is a SELECT query
        if (!SELECT_PATTERN.matcher(trimmedSql).find()) {
            throw new SecurityException("Invalid SQL query. Only SELECT queries are supported.");
        }
        
        // Check for comments which can be used to bypass checks
        if (trimmedSql.contains("--") || trimmedSql.contains("/*")) {
            throw new SecurityException("Comments are not allowed in SQL queries for security reasons.");
        }
    }
}
