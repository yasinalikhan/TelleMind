package com.telemind.analytics.repository;

import com.telemind.analytics.model.SavedQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedQueryRepository extends JpaRepository<SavedQuery, Long> {
    List<SavedQuery> findByTenantIdOrderByUpdatedAtDesc(String tenantId);
    Optional<SavedQuery> findByIdAndTenantId(Long id, String tenantId);
}
