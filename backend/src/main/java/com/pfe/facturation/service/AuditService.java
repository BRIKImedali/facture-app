// AuditService.java — Service pour l'enregistrement et la consultation des logs d'audit
package com.pfe.facturation.service;

import com.pfe.facturation.model.AuditLog;
import com.pfe.facturation.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service pour la gestion des logs d'audit.
 * Fournit des méthodes pour enregistrer manuellement des logs
 * et pour les consulter/filtrer depuis l'interface d'administration.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    /**
     * Enregistre manuellement un log d'audit.
     * À utiliser quand l'AOP ne suffit pas (ex: login/logout).
     */
    @Transactional
    public AuditLog logAction(Long userId, String username, String actionType,
                               String entityType, Long entityId,
                               String oldValue, String newValue,
                               String ipAddress, String description) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .username(username != null ? username : "SYSTEM")
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress != null ? ipAddress : "UNKNOWN")
                .description(description)
                .build();

            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Erreur lors de l'enregistrement du log d'audit : {}", e.getMessage());
            return null;
        }
    }

    /**
     * Récupère les logs avec filtres et pagination.
     *
     * @param userEmail Filtre par email utilisateur (optionnel)
     * @param actionType Filtre par type d'action (optionnel)
     * @param entityType Filtre par type d'entité (optionnel)
     * @param startDate Date de début (optionnel)
     * @param endDate Date de fin (optionnel)
     * @param page Numéro de page (0-indexé)
     * @param size Taille de page
     * @return Page de logs d'audit
     */
    public Page<AuditLog> getLogs(String username, String actionType, String entityType,
                                   LocalDateTime startDate, LocalDateTime endDate,
                                   int page, int size) {
        return auditLogRepository.findWithFilters(
            username, actionType, entityType, startDate, endDate,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }

    /**
     * Récupère un log d'audit par son ID.
     */
    public AuditLog getLogById(Long id) {
        return auditLogRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Log d'audit introuvable : " + id));
    }

    /**
     * Récupère les 10 derniers logs pour le widget dashboard.
     */
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop10ByOrderByCreatedAtDesc(
            PageRequest.of(0, 10)
        );
    }

    /**
     * Récupère tous les logs pour l'export (entre deux dates).
     */
    public List<AuditLog> getLogsForExport(LocalDateTime start, LocalDateTime end) {
        if (start == null) start = LocalDateTime.now().minusMonths(1);
        if (end == null) end = LocalDateTime.now();
        return auditLogRepository.findBetweenDates(start, end);
    }

    /**
     * Nombre total de logs depuis une date.
     */
    public Long countSince(LocalDateTime since) {
        return auditLogRepository.countSince(since);
    }
}
