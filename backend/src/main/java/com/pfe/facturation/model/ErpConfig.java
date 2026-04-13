// ErpConfig.java — Entité JPA pour la configuration ERP
package com.pfe.facturation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant une configuration d'intégration ERP.
 * Supporte : Odoo, SAP, Sage, Microsoft Dynamics, API Personnalisée.
 * Les credentials (API Key, password) sont chiffrés en AES-256.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "erp_configs")
public class ErpConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Type d'ERP : ODOO, SAP, SAGE, DYNAMICS, CUSTOM */
    @NotBlank(message = "Le type d'ERP est obligatoire")
    @Column(name = "erp_type", nullable = false, length = 20)
    private String erpType;

    /** Nom d'affichage de la configuration */
    @Column(name = "display_name", length = 100)
    private String displayName;

    /** URL de l'API de l'ERP */
    @Column(name = "api_url", length = 500)
    private String apiUrl;

    /** Méthode d'authentification : API_KEY, OAUTH, BASIC_AUTH */
    @Column(name = "auth_type", length = 20)
    private String authType;

    /** Clé API chiffrée en AES-256 */
    @Column(name = "api_key_encrypted")
    private String apiKeyEncrypted;

    /** Nom d'utilisateur pour l'authentification Basic/OAuth */
    @Column(length = 100)
    private String username;

    /** Mot de passe chiffré pour l'authentification Basic */
    @Column(name = "password_encrypted")
    private String passwordEncrypted;

    /** Token OAuth chiffré (pour OAuth2) */
    @Column(name = "oauth_token_encrypted")
    private String oauthTokenEncrypted;

    /** Configuration active ou non */
    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = false;

    /** Intervalle de synchronisation automatique en minutes */
    @Builder.Default
    @Column(name = "sync_interval_minutes")
    private Integer syncIntervalMinutes = 60;

    /** Date de création */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Date de dernière mise à jour */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Paramètres de synchronisation associés à cette configuration ERP.
     * Un ErpConfig peut avoir plusieurs ErpSyncSetting (un par entité : Clients, Produits, Factures).
     */
    @Builder.Default
    @OneToMany(mappedBy = "erpConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ErpSyncSetting> syncSettings = new ArrayList<>();

    /**
     * Mappings de champs associés.
     */
    @Builder.Default
    @OneToMany(mappedBy = "erpConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ErpFieldMapping> fieldMappings = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
