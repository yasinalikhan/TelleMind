package com.telemind.analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.telemind.analytics.model.CustomDataset;
import com.telemind.analytics.repository.CustomDatasetRepository;
import com.telemind.analytics.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private static final Logger log = LoggerFactory.getLogger(DatasetController.class);

    private final CustomDatasetRepository customDatasetRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<String> RESERVED_KEYWORDS = Set.of(
            "select", "table", "order", "group", "by", "where", "join", "from", 
            "having", "limit", "offset", "insert", "update", "delete", "create", 
            "drop", "alter", "column", "row", "user", "date", "timestamp", "id"
    );

    public DatasetController(CustomDatasetRepository customDatasetRepository, JdbcTemplate jdbcTemplate) {
        this.customDatasetRepository = customDatasetRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<CustomDataset>> getDatasets() {
        String tenantId = TenantContext.getCurrentTenant();
        log.info("Fetching custom datasets for tenant: {}", tenantId);
        List<CustomDataset> datasets = customDatasetRepository.findByTenantId(tenantId);
        return ResponseEntity.ok(datasets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDataset(@PathVariable Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        Optional<CustomDataset> datasetOpt = customDatasetRepository.findByIdAndTenantId(id, tenantId);
        if (datasetOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CustomDataset dataset = datasetOpt.get();
        String fullTableName = "ds_" + tenantId.replace("-", "_") + "_" + dataset.getTableName();

        try {
            // Fetch first 10 rows for preview
            String previewSql = "SELECT * FROM " + fullTableName + " LIMIT 10";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(previewSql);

            // Strip the tenant_id column from the preview rows
            for (Map<String, Object> row : rows) {
                row.remove("tenant_id");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("dataset", dataset);
            response.put("preview", rows);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch preview for dataset {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to retrieve preview: " + e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDataset(@RequestParam("file") MultipartFile file) {
        String tenantId = TenantContext.getCurrentTenant();
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Uploaded file is empty"));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only CSV files are supported"));
        }

        try {
            // Read CSV into memory to infer schema and load data
            List<List<String>> allRows = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    allRows.add(parseCsvLine(line));
                }
            }

            if (allRows.isEmpty() || allRows.get(0).isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "CSV file does not contain header or data"));
            }

            List<String> rawHeaders = allRows.get(0);
            List<List<String>> dataRows = allRows.subList(1, allRows.size());

            // 1. Sanitize Table Name
            String baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
            String sanitizedTableName = sanitizeIdentifier(baseName);
            if (sanitizedTableName.isEmpty()) {
                sanitizedTableName = "uploaded_data";
            }

            // Check if table name already exists for this tenant
            Optional<CustomDataset> existing = customDatasetRepository.findByTableNameAndTenantId(sanitizedTableName, tenantId);
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "A dataset with the name '" + sanitizedTableName + "' already exists."));
            }

            // 2. Sanitize Headers
            List<String> sanitizedHeaders = new ArrayList<>();
            Set<String> uniqueHeaders = new HashSet<>();
            for (String h : rawHeaders) {
                String sh = sanitizeIdentifier(h);
                if (uniqueHeaders.contains(sh)) {
                    int counter = 1;
                    while (uniqueHeaders.contains(sh + "_" + counter)) {
                        counter++;
                    }
                    sh = sh + "_" + counter;
                }
                uniqueHeaders.add(sh);
                sanitizedHeaders.add(sh);
            }

            // 3. Infer Types
            Map<String, String> schemaMap = new LinkedHashMap<>();
            int numCols = sanitizedHeaders.size();
            for (int col = 0; col < numCols; col++) {
                String header = sanitizedHeaders.get(col);
                String inferredType = inferColumnType(dataRows, col);
                schemaMap.put(header, inferredType);
            }

            // 4. Create Database Table
            String dbTenantId = tenantId.replace("-", "_");
            String fullTableName = "ds_" + dbTenantId + "_" + sanitizedTableName;

            StringBuilder ddl = new StringBuilder("CREATE TABLE ")
                    .append(fullTableName)
                    .append(" (id SERIAL PRIMARY KEY, ");
            for (Map.Entry<String, String> entry : schemaMap.entrySet()) {
                ddl.append(entry.getKey()).append(" ").append(entry.getValue()).append(", ");
            }
            ddl.append("tenant_id VARCHAR(50) NOT NULL)");

            log.info("Creating dynamic table for tenant {}: {}", tenantId, ddl);
            jdbcTemplate.execute(ddl.toString());

            // 5. Batch Insert Data
            String insertSql = "INSERT INTO " + fullTableName + " (" +
                    String.join(", ", sanitizedHeaders) + ", tenant_id) VALUES (" +
                    String.join(", ", Collections.nCopies(numCols, "?")) + ", ?)";

            List<Object[]> batchArgs = new ArrayList<>();
            for (List<String> row : dataRows) {
                if (row.size() < numCols) {
                    // Pad row if it is missing columns
                    row = new ArrayList<>(row);
                    while (row.size() < numCols) {
                        row.add("");
                    }
                }

                Object[] args = new Object[numCols + 1];
                for (int col = 0; col < numCols; col++) {
                    String val = row.get(col);
                    String type = schemaMap.get(sanitizedHeaders.get(col));
                    args[col] = parseValue(val, type);
                }
                args[numCols] = tenantId;
                batchArgs.add(args);
            }

            log.info("Inserting {} rows into {}", batchArgs.size(), fullTableName);
            if (!batchArgs.isEmpty()) {
                jdbcTemplate.batchUpdate(insertSql, batchArgs);
            }

            // 6. Save Custom Dataset Metadata
            CustomDataset customDataset = new CustomDataset();
            customDataset.setTableName(sanitizedTableName);
            customDataset.setOriginalFilename(originalFilename);
            customDataset.setTenantId(tenantId);
            customDataset.setRowCount(batchArgs.size());
            customDataset.setSchemaJson(objectMapper.writeValueAsString(schemaMap));

            CustomDataset saved = customDatasetRepository.save(customDataset);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            log.error("Failed to upload dataset", e);
            return ResponseEntity.badRequest().body(Map.of("error", "CSV parsing/upload failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDataset(@PathVariable Long id) {
        String tenantId = TenantContext.getCurrentTenant();
        Optional<CustomDataset> datasetOpt = customDatasetRepository.findByIdAndTenantId(id, tenantId);
        if (datasetOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CustomDataset dataset = datasetOpt.get();
        String fullTableName = "ds_" + tenantId.replace("-", "_") + "_" + dataset.getTableName();

        try {
            // Drop dynamic table
            log.info("Dropping custom database table: {}", fullTableName);
            jdbcTemplate.execute("DROP TABLE IF EXISTS " + fullTableName);

            // Delete metadata
            customDatasetRepository.delete(dataset);
            return ResponseEntity.ok(Map.of("message", "Dataset deleted successfully"));
        } catch (Exception e) {
            log.error("Failed to delete dataset {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to drop dataset table: " + e.getMessage()));
        }
    }

    // Helper methods for CSV parsing and Type Inference
    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());

        for (int i = 0; i < values.size(); i++) {
            String val = values.get(i);
            if (val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
                values.set(i, val.substring(1, val.length() - 1));
            }
        }
        return values;
    }

    private String sanitizeIdentifier(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        String sanitized = name.replaceAll("[^a-zA-Z0-9_]", "_").toLowerCase();
        // Remove multiple consecutive underscores
        sanitized = sanitized.replaceAll("_{2,}", "_");
        // Remove leading underscores or digits
        if (sanitized.startsWith("_")) {
            sanitized = sanitized.substring(1);
        }
        if (sanitized.isEmpty()) {
            return "col";
        }
        if (Character.isDigit(sanitized.charAt(0))) {
            sanitized = "col_" + sanitized;
        }
        if (RESERVED_KEYWORDS.contains(sanitized)) {
            sanitized = sanitized + "_val";
        }
        return sanitized;
    }

    private String inferColumnType(List<List<String>> rows, int colIdx) {
        boolean maybeInteger = true;
        boolean maybeNumeric = true;
        boolean maybeDate = true;
        int checkedCount = 0;

        for (int i = 0; i < Math.min(rows.size(), 100); i++) {
            List<String> row = rows.get(i);
            if (colIdx >= row.size()) {
                continue;
            }
            String val = row.get(colIdx).trim();
            if (val.isEmpty()) {
                continue; // Skip empty fields for type checking
            }
            checkedCount++;

            // 1. Integer check
            if (maybeInteger && !val.matches("^-?\\d+$")) {
                maybeInteger = false;
            }
            // 2. Numeric check
            if (maybeNumeric && !val.matches("^-?\\d*\\.?\\d+$")) {
                maybeNumeric = false;
            }
            // 3. Date check (YYYY-MM-DD)
            if (maybeDate && !val.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                maybeDate = false;
            }
        }

        if (checkedCount == 0) {
            return "VARCHAR(255)";
        }
        if (maybeInteger) {
            return "INTEGER";
        }
        if (maybeNumeric) {
            return "NUMERIC";
        }
        if (maybeDate) {
            return "DATE";
        }
        return "VARCHAR(255)";
    }

    private Object parseValue(String val, String type) {
        if (val == null || val.trim().isEmpty()) {
            return null;
        }
        String trimmed = val.trim();
        try {
            switch (type) {
                case "INTEGER":
                    return Integer.parseInt(trimmed);
                case "NUMERIC":
                    return new BigDecimal(trimmed);
                case "DATE":
                    return Date.valueOf(trimmed);
                default:
                    return trimmed;
            }
        } catch (Exception e) {
            log.warn("Failed to parse '{}' as type {}, returning null", val, type);
            return null;
        }
    }
}
