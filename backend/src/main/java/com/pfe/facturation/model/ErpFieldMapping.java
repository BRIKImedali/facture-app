// ErpFieldMapping.java — Entité pour le mapping des champs ERP → Application
package com.pfe.facturation.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Mapping de champs entre l'ERP et l'application.
 * Exemple : champ ERP "partner_name" → champ application "client.nom"
 * Permet d'adapter facilement les noms de champs de différents ERPs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "erp_field_mappings")
public class ErpFieldMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Configuration ERP parente */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "erp_config_id", nullable = false)
    private ErpConfig erpConfig;

    /**
     * Type d'entité : CLIENT, PRODUIT, FACTURE
     */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** Nom du champ dans l'ERP (ex: partner_name, product_code) */
    @Column(name = "erp_field", length = 100)
    private String erpField;

    /** Nom du champ dans l'application (ex: nom, reference) */
    @Column(name = "app_field", length = 100)
    private String appField;

    /** Transformation à appliquer (optionnel) : UPPERCASE, LOWERCASE, TRIM, etc. */
    @Column(name = "transformation", length = 50)
    private String transformation;
}
