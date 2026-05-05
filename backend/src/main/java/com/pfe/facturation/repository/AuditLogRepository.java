// AuditLogRepository.java — Repository pour les logs d'audit
package com.pfe.facturation.repository;

import com.pfe.facturation.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour la consultation et l'export des logs d'audit.
 * Fournit des requêtes de filtrage avancé pour l'interface d'audit.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /** Logs d'audit paginés avec filtres multiples */
    @Query(value = "SELECT al FROM AuditLog al WHERE " +
           "(:username IS NULL OR LOWER(al.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(:actionType IS NULL OR al.actionType = :actionType) AND " +
           "(:entityType IS NULL OR al.entityType = :entityType) AND " +
           "(:startDate IS NULL OR al.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR al.createdAt <= :endDate)",
           countQuery = "SELECT COUNT(al) FROM AuditLog al WHERE " +
           "(:username IS NULL OR LOWER(al.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(:actionType IS NULL OR al.actionType = :actionType) AND " +
           "(:entityType IS NULL OR al.entityType = :entityType) AND " +
           "(:startDate IS NULL OR al.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR al.createdAt <= :endDate)")
    Page<AuditLog> findWithFilters(
        @Param("username") String username,
        @Param("actionType") String actionType,
        @Param("entityType") String entityType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    /** Logs d'audit pour un utilisateur spécifique */
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Logs récents par type d'action */
    List<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType);

    /** Logs récents par entité */
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    /** Nombre d'actions effectuées dans une période */
    @Query("SELECT COUNT(al) FROM AuditLog al WHERE al.createdAt >= :since")
    Long countSince(@Param("since") LocalDateTime since);

    /** Les 10 dernières actions pour le dashboard */
    @Query("SELECT al FROM AuditLog al ORDER BY al.createdAt DESC")
    List<AuditLog> findTop10ByOrderByCreatedAtDesc(Pageable pageable);

    /** Logs entre deux dates pour l'export */
    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :start AND :end ORDER BY al.createdAt DESC")
    List<AuditLog> findBetweenDates(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
