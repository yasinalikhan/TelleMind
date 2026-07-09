package com.telemind.analytics.security;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SqlValidatorServiceTest {

    private final SqlValidatorService validator = new SqlValidatorService();

    @Test
    public void testSafeQueries() {
        assertDoesNotThrow(() -> validator.validateQuery("SELECT * FROM subscriber"));
        assertDoesNotThrow(() -> validator.validateQuery("   select id, msisdn from subscriber where status = 'Active'"));
        assertDoesNotThrow(() -> validator.validateQuery("SELECT SUM(amount) FROM revenue GROUP BY region"));
    }

    @Test
    public void testUnsafeQueriesBlocked() {
        // SQL injection keywords
        assertThrows(SecurityException.class, () -> validator.validateQuery("DROP TABLE subscriber"));
        assertThrows(SecurityException.class, () -> validator.validateQuery("DELETE FROM subscriber WHERE id = 1"));
        assertThrows(SecurityException.class, () -> validator.validateQuery("UPDATE subscriber SET recharge_amount = 0"));
        assertThrows(SecurityException.class, () -> validator.validateQuery("INSERT INTO subscriber (msisdn) VALUES ('+93799000101')"));
        
        // Non-select queries
        assertThrows(SecurityException.class, () -> validator.validateQuery("SHOW TABLES"));
    }

    @Test
    public void testCommentsBlocked() {
        // Comment evasion
        assertThrows(SecurityException.class, () -> validator.validateQuery("SELECT * FROM subscriber -- comment"));
        assertThrows(SecurityException.class, () -> validator.validateQuery("SELECT * FROM subscriber /* comment */"));
    }
}
