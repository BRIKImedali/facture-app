// DatabaseProfile.java — Entité JPA pour les profils de connexion BDD
package com.pfe.facturation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité représentant un profil de connexion à une base de données.
 * Permet à l'admin de gérer plusieurs configurations de BDD (Production, Test, Dev).
 * Les credentials sont chiffrés en AES-256 avant stockage.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "database_profiles")
public class DatabaseProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom unique du profil (ex: Production, Test, Dev) */
    @NotBlank(message = "Le nom du profil est obligatoire")
    @Column(name = "profile_name", unique = true, nullable = false, length = 100)
    private String profileName;

    /** Type de base de données : POSTGRESQL, MYSQL, ORACLE, SQLSERVER */
    @NotBlank(message = "Le type de BDD est obligatoire")
    @Column(name = "db_type", nullable = false, length = 20)
    private String dbType;

    /** Adresse du serveur de base de données */
    @NotBlank(message = "L'hôte est obligatoire")
    @Column(nullable = false, length = 255)
    private String host;

    /** Port de connexion */
    @NotNull(message = "Le port est obligatoire")
    @Positive(message = "Le port doit être un nombre positif")
    @Column(nullable = false)
    private Integer port;

    /** Nom de la base de données */
    @NotBlank(message = "Le nom de la base de données est obligatoire")
    @Column(name = "database_name", nullable = false, length = 100)
    private String databaseName;

    /** Nom d'utilisateur de la BDD */
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Column(nullable = false, length = 100)
    private String username;

    /** Mot de passe chiffré en AES-256 */
    @Column(name = "password_encrypted")
    private String passwordEncrypted;

    /** Indique si ce profil est actuellement actif/utilisé */
    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = false;

    /** Indique si ce profil est le profil par défaut */
    @Builder.Default
    @Column(name = "is_default")
    private Boolean isDefault = false;

    /** Date de création du profil */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Date de dernière mise à jour */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Email de l'utilisateur qui a créé ce profil */
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /** Initialisation automatique des timestamps */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /** Mise à jour automatique du timestamp de modification */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
