// ErpConfigController.java — Controller REST pour la gestion des intégrations ERP
package com.pfe.facturation.controller;

import com.pfe.facturation.model.ErpConfig;
import com.pfe.facturation.model.ErpSyncHistory;
import com.pfe.facturation.service.ErpIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la gestion des intégrations ERP.
 * Accessible à : /api/admin/erp/**
 */
@RestController
@RequestMapping("/api/admin/erp")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ErpConfigController {

    private final ErpIntegrationService erpIntegrationService;

    /** GET /api/admin/erp/configs — Liste toutes les configurations ERP */
    @GetMapping("/configs")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<List<ErpConfig>> getAllConfigs() {
        List<ErpConfig> configs = erpIntegrationService.getAllConfigs();
        // Masquer les credentials dans la réponse
        configs.forEach(c -> {
            c.setApiKeyEncrypted("****");
            c.setPasswordEncrypted("****");
            c.setOauthTokenEncrypted("****");
        });
        return ResponseEntity.ok(configs);
    }

    /** GET /api/admin/erp/configs/{id} — Détail d'une configuration */
    @GetMapping("/configs/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<ErpConfig> getConfigById(@PathVariable Long id) {
        ErpConfig config = erpIntegrationService.getConfigById(id);
        config.setApiKeyEncrypted("****");
        config.setPasswordEncrypted("****");
        return ResponseEntity.ok(config);
    }

    /** POST /api/admin/erp/configs — Crée une configuration ERP */
    @PostMapping("/configs")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> createConfig(@RequestBody ErpConfig config) {
        try {
            ErpConfig created = erpIntegrationService.createConfig(config);
            created.setApiKeyEncrypted("****");
            created.setPasswordEncrypted("****");
            return ResponseEntity.ok(Map.of("success", true, "message", "Configuration ERP créée", "config", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** PUT /api/admin/erp/configs/{id} — Met à jour une configuration ERP */
    @PutMapping("/configs/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> updateConfig(
            @PathVariable Long id, @RequestBody ErpConfig config) {
        try {
            ErpConfig updated = erpIntegrationService.updateConfig(id, config);
            updated.setApiKeyEncrypted("****");
            updated.setPasswordEncrypted("****");
            return ResponseEntity.ok(Map.of("success", true, "message", "Configuration mise à jour", "config", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** DELETE /api/admin/erp/configs/{id} — Supprime une configuration ERP */
    @DeleteMapping("/configs/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> deleteConfig(@PathVariable Long id) {
        try {
            erpIntegrationService.deleteConfig(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Configuration supprimée"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** POST /api/admin/erp/configs/{id}/test — Teste la connexion à l'ERP */
    @PostMapping("/configs/{id}/test")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable Long id) {
        return ResponseEntity.ok(erpIntegrationService.testConnection(id));
    }

    /**
     * POST /api/admin/erp/sync/manual — Déclenche une sync manuelle.
     * Body : { configId: 1, entityType: "CLIENT" }
     */
    @PostMapping("/sync/manual")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> triggerManualSync(@RequestBody Map<String, Object> body) {
        try {
            Long configId = Long.valueOf(body.get("configId").toString());
            String entityType = (String) body.getOrDefault("entityType", "ALL");
            ErpSyncHistory history = erpIntegrationService.triggerManualSync(configId, entityType);
            return ResponseEntity.ok(Map.of(
                "success", "SUCCESS".equals(history.getStatus()),
                "status", history.getStatus(),
                "durationMs", history.getDurationMs() != null ? history.getDurationMs() : 0,
                "message", "Synchronisation terminée avec statut : " + history.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * GET /api/admin/erp/sync/history — Historique des synchronisations.
     */
    @GetMapping("/sync/history")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> getSyncHistory(
            @RequestParam(required = false) Long configId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<ErpSyncHistory> historyPage = erpIntegrationService.getSyncHistory(
            configId, status, entityType, page, size
        );

        return ResponseEntity.ok(Map.of(
            "history", historyPage.getContent(),
            "totalElements", historyPage.getTotalElements(),
            "totalPages", historyPage.getTotalPages(),
            "currentPage", page
        ));
    }
}
