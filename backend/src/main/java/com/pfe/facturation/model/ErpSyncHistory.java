// ErpSyncHistory.java — Entité pour l'historique des synchronisations ERP
package com.pfe.facturation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Historique d'une synchronisation ERP.
 * Enregistre le résultat de chaque synchronisation : statut, nombre d'enregistrements,
 * erreurs éventuelles et durée.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "erp_sync_history", indexes = {
    @Index(name = "idx_sync_history_config", columnList = "erp_config_id"),
    @Index(name = "idx_sync_history_date", columnList = "sync_date")
})
public class ErpSyncHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Configuration ERP utilisée pour cette synchronisation */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "erp_config_id", nullable = false)
    private ErpConfig erpConfig;

    /** Date et heure de la synchronisation */
    @Column(name = "sync_date")
    private LocalDateTime syncDate;

    /** Type d'entité synchronisée : CLIENT, PRODUIT, FACTURE */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /**
     * Statut de la synchronisation : SUCCESS, PARTIAL_SUCCESS, FAILED, IN_PROGRESS
     */
    @Column(length = 20)
    private String status;

    /** Nombre d'enregistrements importés depuis l'ERP */
    @Builder.Default
    @Column(name = "records_imported")
    private Integer recordsImported = 0;

    /** Nombre d'enregistrements exportés vers l'ERP */
    @Builder.Default
    @Column(name = "records_exported")
    private Integer recordsExported = 0;

    /** Message d'erreur en cas d'échec (peut être du JSON pour plusieurs erreurs) */
    @Column(columnDefinition = "TEXT")
    private String errors;

    /** Durée de la synchronisation en millisecondes */
    @Column(name = "duration_ms")
    private Long durationMs;

    /** Message d'information supplémentaire */
    @Column(name = "info_message", length = 500)
    private String infoMessage;

    @PrePersist
    protected void onCreate() {
        if (syncDate == null) {
            syncDate = LocalDateTime.now();
        }
    }
}
