// AuditController.java — Controller REST pour la consultation des logs d'audit
package com.pfe.facturation.controller;

import com.pfe.facturation.model.AuditLog;
import com.pfe.facturation.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la consultation des logs d'audit.
 * Accessible à : /api/admin/audit/**
 *
 * Tous les endpoints nécessitent la permission SYSTEM:AUDIT.
 */
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuditController {

    private final AuditService auditService;

    /**
     * GET /api/admin/audit/logs — Liste paginée des logs avec filtres.
     *
     * Paramètres de filtrage optionnels :
     * - userEmail : filtre par email utilisateur
     * - actionType : filtre par type d'action
     * - entityType : filtre par type d'entité
     * - startDate  : date de début (ISO 8601)
     * - endDate    : date de fin (ISO 8601)
     */
    @GetMapping("/logs")
    @PreAuthorize("hasPermission('SYSTEM', 'AUDIT')")
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AuditLog> logsPage = auditService.getLogs(
            userEmail, actionType, entityType, startDate, endDate, page, size
        );

        return ResponseEntity.ok(Map.of(
            "logs", logsPage.getContent(),
            "totalElements", logsPage.getTotalElements(),
            "totalPages", logsPage.getTotalPages(),
            "currentPage", page
        ));
    }

    /**
     * GET /api/admin/audit/logs/{id} — Détail d'un log d'audit.
     */
    @GetMapping("/logs/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'AUDIT')")
    public ResponseEntity<AuditLog> getAuditLogById(@PathVariable Long id) {
        return ResponseEntity.ok(auditService.getLogById(id));
    }

    /**
     * GET /api/admin/audit/export — Exporte les logs entre deux dates.
     * Retourne la liste complète (non paginée) pour export CSV/Excel.
     */
    @GetMapping("/export")
    @PreAuthorize("hasPermission('SYSTEM', 'AUDIT')")
    public ResponseEntity<List<AuditLog>> exportAuditLogs(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<AuditLog> logs = auditService.getLogsForExport(startDate, endDate);
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/admin/audit/stats — Statistiques des logs (pour le dashboard).
     */
    @GetMapping("/stats")
    @PreAuthorize("hasPermission('SYSTEM', 'AUDIT')")
    public ResponseEntity<Map<String, Object>> getAuditStats() {
        LocalDateTime lastWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0);

        return ResponseEntity.ok(Map.of(
            "totalToday", auditService.countSince(today),
            "totalLastWeek", auditService.countSince(lastWeek),
            "totalLastMonth", auditService.countSince(lastMonth),
            "recentLogs", auditService.getRecentLogs()
        ));
    }
}
