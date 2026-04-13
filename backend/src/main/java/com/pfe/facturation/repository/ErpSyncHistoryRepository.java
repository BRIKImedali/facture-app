// ErpSyncHistoryRepository.java — Repository pour l'historique des synchronisations
package com.pfe.facturation.repository;

import com.pfe.facturation.model.ErpSyncHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour la consultation de l'historique des synchronisations ERP.
 */
@Repository
public interface ErpSyncHistoryRepository extends JpaRepository<ErpSyncHistory, Long> {

    /** Historique paginé pour une configuration ERP */
    Page<ErpSyncHistory> findByErpConfigIdOrderBySyncDateDesc(Long erpConfigId, Pageable pageable);

    /** Dernière synchronisation pour un type d'entité */
    Optional<ErpSyncHistory> findTopByErpConfigIdAndEntityTypeOrderBySyncDateDesc(
        Long erpConfigId, String entityType);

    /** Toutes les syncs avec filtre optionnel sur le statut */
    @Query("SELECT h FROM ErpSyncHistory h WHERE " +
           "(:erpConfigId IS NULL OR h.erpConfig.id = :erpConfigId) AND " +
           "(:status IS NULL OR h.status = :status) AND " +
           "(:entityType IS NULL OR h.entityType = :entityType) " +
           "ORDER BY h.syncDate DESC")
    Page<ErpSyncHistory> findWithFilters(
        @Param("erpConfigId") Long erpConfigId,
        @Param("status") String status,
        @Param("entityType") String entityType,
        Pageable pageable
    );

    /** Statistiques des syncs : nombre par statut */
    @Query("SELECT h.status, COUNT(h) FROM ErpSyncHistory h GROUP BY h.status")
    List<Object[]> countByStatus();

    /** Dernière sync réussie globale */
    Optional<ErpSyncHistory> findTopByStatusOrderBySyncDateDesc(String status);
}
