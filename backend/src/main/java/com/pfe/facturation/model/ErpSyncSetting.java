// ErpSyncSetting.java — Entité pour les paramètres de synchronisation ERP
package com.pfe.facturation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Paramètres de synchronisation pour une entité spécifique dans un ERP.
 * Exemple : synchronisation bidirectionnelle des Clients avec Odoo toutes les 30 minutes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "erp_sync_settings")
public class ErpSyncSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Configuration ERP parente */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "erp_config_id", nullable = false)
    private ErpConfig erpConfig;

    /**
     * Type d'entité synchronisée : CLIENT, PRODUIT, FACTURE
     */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** Synchronisation activée ou non pour cette entité */
    @Builder.Default
    @Column(name = "sync_enabled")
    private Boolean syncEnabled = true;

    /**
     * Direction de synchronisation :
     * ERP_TO_APP : ERP → Application (import)
     * APP_TO_ERP : Application → ERP (export)
     * BIDIRECTIONAL : Les deux sens
     */
    @Column(name = "sync_direction", length = 20)
    private String syncDirection;

    /** Timestamp de la dernière synchronisation réussie */
    @Column(name = "last_sync")
    private LocalDateTime lastSync;
}
