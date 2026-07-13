package com.telemind.analytics.repository;

import com.telemind.analytics.model.DashboardConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardRepository extends JpaRepository<DashboardConfig, Long> {
    List<DashboardConfig> findByTenantId(String tenantId);
    Optional<DashboardConfig> findByIdAndTenantId(Long id, String tenantId);
}
