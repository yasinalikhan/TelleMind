package com.telemind.analytics.query;

import com.telemind.analytics.security.SqlValidatorService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class QueryExecutorServiceTest {

    // Instantiate with null for JdbcTemplate & Cache since injectTenantFilter only performs AST processing.
    private final SqlValidatorService validator = new SqlValidatorService();
    private final QueryExecutorService executor = new QueryExecutorService(null, validator, null);

    @Test
    public void testTenantFilterInjectionSimple() {
        String query = "SELECT * FROM subscriber";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertEquals("SELECT * FROM subscriber WHERE tenant_id = 'tenant_abc'", secured);
    }

    @Test
    public void testTenantFilterInjectionWithWhere() {
        String query = "SELECT * FROM subscriber WHERE status = 'Active'";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertEquals("SELECT * FROM subscriber WHERE status = 'Active' AND tenant_id = 'tenant_abc'", secured);
    }

    @Test
    public void testTenantFilterInjectionWithGroupBy() {
        String query = "SELECT plan, COUNT(*) FROM subscriber GROUP BY plan";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertEquals("SELECT plan, COUNT(*) FROM subscriber WHERE tenant_id = 'tenant_abc' GROUP BY plan", secured);
    }

    @Test
    public void testTenantFilterInjectionWithOrderBy() {
        String query = "SELECT * FROM revenue ORDER BY date DESC";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertEquals("SELECT * FROM revenue WHERE tenant_id = 'tenant_abc' ORDER BY date DESC", secured);
    }

    @Test
    public void testTenantFilterInjectionWithLimit() {
        String query = "SELECT * FROM usage LIMIT 5";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertEquals("SELECT * FROM usage WHERE tenant_id = 'tenant_abc' LIMIT 5", secured);
    }

    @Test
    public void testNoDoubleInjection() {
        String query = "SELECT * FROM subscriber WHERE tenant_id = 'tenant_xyz'";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertEquals(query, secured);
    }

    @Test
    public void testTenantFilterInjectionWithUnion() {
        String query = "SELECT msisdn FROM subscriber UNION ALL SELECT msisdn FROM subscriber";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertTrue(secured.contains("WHERE tenant_id = 'tenant_abc'"));
        // Both branches of UNION must be secured
        int count = 0;
        int idx = 0;
        while ((idx = secured.indexOf("tenant_id = 'tenant_abc'", idx)) != -1) {
            count++;
            idx += "tenant_id = 'tenant_abc'".length();
        }
        assertEquals(2, count, "Both sides of UNION should have tenant_id injected");
    }

    @Test
    public void testTenantFilterInjectionWithCTE() {
        String query = "WITH active_subs AS (SELECT * FROM subscriber WHERE status = 'Active') SELECT * FROM active_subs";
        String secured = executor.injectTenantFilter(query, "tenant_abc");
        assertTrue(secured.contains("tenant_id = 'tenant_abc'"));
    }

    @Test
    public void testTenantPlaceholderReplacement() {
        String query = "SELECT * FROM subscriber WHERE tenant_id = <tenant_id> AND status = 'Active'";
        String secured = executor.injectTenantFilter(query, "tenant_prod_1");
        assertTrue(secured.contains("tenant_id = 'tenant_prod_1'"));
        assertFalse(secured.contains("<tenant_id>"));
    }
}
