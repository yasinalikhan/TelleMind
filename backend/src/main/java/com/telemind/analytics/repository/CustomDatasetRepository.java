package com.telemind.analytics.repository;

import com.telemind.analytics.model.CustomDataset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomDatasetRepository extends JpaRepository<CustomDataset, Long> {
    List<CustomDataset> findByTenantId(String tenantId);
    Optional<CustomDataset> findByIdAndTenantId(Long id, String tenantId);
    Optional<CustomDataset> findByTableNameAndTenantId(String tableName, String tenantId);
}
