// AdminDashboardController.java — Controller REST pour le tableau de bord admin
package com.pfe.facturation.controller;

import com.pfe.facturation.repository.AuditLogRepository;
import com.pfe.facturation.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Controller REST pour le tableau de bord d'administration.
 * Fournit les statistiques globales et les données des widgets.
 *
 * Tous les endpoints nécessitent la permission SYSTEM:CONFIG.
 * Accessible à : /api/admin/dashboard/**
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AdminDashboardController {

    private final UserManagementService userManagementService;
    private final ErpIntegrationService erpIntegrationService;
    private final DatabaseConfigService databaseConfigService;
    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;

    /**
     * GET /api/admin/dashboard/stats
     * Statistiques globales pour le dashboard :
     * - Nombre d'utilisateurs actifs
     * - Statut de la connexion BDD
     * - Dernière sync ERP
     * - Nombre d'actions d'audit ce mois
     */
    @GetMapping("/stats")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Utilisateurs actifs
        stats.put("activeUsers", userManagementService.countActiveUsers());

        // Statut de la BDD active
        var activeProfile = databaseConfigService.getActiveProfile();
        if (activeProfile.isPresent()) {
            var p = activeProfile.get();
            stats.put("dbStatus", "CONNECTED");
            stats.put("dbProfileName", p.getProfileName());
            stats.put("dbType", p.getDbType());
        } else {
            stats.put("dbStatus", "NO_PROFILE");
            stats.put("dbProfileName", "Aucun profil actif");
        }

        // Dernière sync ERP
        var lastSync = erpIntegrationService.getLastSuccessfulSync();
        if (lastSync != null) {
            stats.put("lastErpSync", lastSync.getSyncDate());
            stats.put("lastErpSyncStatus", lastSync.getStatus());
            stats.put("lastErpSyncType", lastSync.getErpConfig().getErpType());
        } else {
            stats.put("lastErpSync", null);
            stats.put("lastErpSyncStatus", "NEVER");
        }

        // Actions d'audit ce mois
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);
        stats.put("auditActionsThisMonth", auditService.countSince(startOfMonth));

        // Logs récents
        stats.put("recentLogs", auditService.getRecentLogs().stream()
            .limit(5)
            .map(log -> Map.of(
                "id", log.getId(),
                "userEmail", log.getUserEmail() != null ? log.getUserEmail() : "SYSTEM",
                "actionType", log.getActionType(),
                "entityType", log.getEntityType() != null ? log.getEntityType() : "",
                "createdAt", log.getCreatedAt()
            ))
            .toList()
        );

        // Configs ERP actives
        long activeErpConfigs = erpIntegrationService.getAllConfigs().stream()
            .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
            .count();
        stats.put("activeErpConfigs", activeErpConfigs);

        return ResponseEntity.ok(stats);
    }
}
