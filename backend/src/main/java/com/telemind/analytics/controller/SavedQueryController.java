package com.telemind.analytics.controller;

import com.telemind.analytics.model.SavedQuery;
import com.telemind.analytics.repository.SavedQueryRepository;
import com.telemind.analytics.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/queries")
public class SavedQueryController {

    private static final Logger log = LoggerFactory.getLogger(SavedQueryController.class);

    private final SavedQueryRepository savedQueryRepository;

    public SavedQueryController(SavedQueryRepository savedQueryRepository) {
        this.savedQueryRepository = savedQueryRepository;
    }

    @GetMapping
    public ResponseEntity<List<SavedQuery>> getSavedQueries() {
        String tenantId = TenantContext.getCurrentTenant();
        log.info("Fetching saved queries for tenant: {}", tenantId);
        List<SavedQuery> list = savedQueryRepository.findByTenantIdOrderByUpdatedAtDesc(tenantId);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<?> saveQuery(@RequestBody Map<String, String> request) {
        String tenantId = TenantContext.getCurrentTenant();
        String title = request.get("title");
        String queryText = request.get("queryText");
        String queryType = request.getOrDefault("queryType", "SQL");
        String description = request.get("description");
        String category = request.getOrDefault("category", "General");
        String chartType = request.get("chartType");

        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query title is required"));
        }
        if (queryText == null || queryText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query text cannot be empty"));
        }

        log.info("Saving query '{}' for tenant: {}", title, tenantId);
        SavedQuery query = new SavedQuery(
                title.trim(),
                queryText.trim(),
                queryType,
                description,
                category,
                chartType,
                tenantId
        );

        SavedQuery saved = savedQueryRepository.save(query);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuery(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String tenantId = TenantContext.getCurrentTenant();
        Optional<SavedQuery> opt = savedQueryRepository.findByIdAndTenantId(id, tenantId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SavedQuery q = opt.get();
        if (request.containsKey("title")) q.setTitle(request.get("title").trim());
        if (request.containsKey("queryText")) q.setQueryText(request.get("queryText").trim());
        if (request.containsKey("queryType")) q.setQueryType(request.get("queryType"));
        if (request.containsKey("description")) q.setDescription(request.get("description"));
        if (request.containsKey("category")) q.setCategory(request.get("category"));
        if (request.containsKey("chartType")) q.setChartType(request.get("chartType"));
        q.setUpdatedAt(LocalDateTime.now());

        SavedQuery updated = savedQueryRepository.save(q);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuery(@PathVariable Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        Optional<SavedQuery> opt = savedQueryRepository.findByIdAndTenantId(id, tenantId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        log.info("Deleting saved query {} for tenant: {}", id, tenantId);
        savedQueryRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("message", "Query deleted successfully"));
    }
}
