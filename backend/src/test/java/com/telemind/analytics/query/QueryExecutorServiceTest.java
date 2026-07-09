package com.telemind.analytics.query;

import com.telemind.analytics.security.SqlValidatorService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class QueryExecutorServiceTest {

    // Instantiate with null for JdbcTemplate since injectTenantFilter only performs string processing.
    private final SqlValidatorService validator = new SqlValidatorService();
    private final QueryExecutorService executor = new QueryExecutorService(null, validator);

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
}
