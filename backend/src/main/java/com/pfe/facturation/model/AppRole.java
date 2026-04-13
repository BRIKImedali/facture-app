// AppRole.java — Entité JPA pour les rôles personnalisables du système d'administration
package com.pfe.facturation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entité représentant un rôle applicatif dans le système de permissions.
 * Différent de l'enum Role existant (ADMIN/USER), ce rôle est dynamique
 * et peut être créé/modifié par l'administrateur.
 * 
 * Nommé AppRole pour éviter le conflit avec l'enum Role existant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "app_roles")
public class AppRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom unique du rôle (ex: SUPER_ADMIN, MANAGER, VIEWER) */
    @NotBlank(message = "Le nom du rôle est obligatoire")
    @Column(unique = true, nullable = false, length = 100)
    private String name;

    /** Description du rôle */
    @Column(length = 255)
    private String description;

    /**
     * Indique si c'est un rôle système (SUPER_ADMIN) non modifiable.
     * Les rôles système ne peuvent pas être supprimés ni avoir leurs permissions modifiées.
     */
    @Builder.Default
    @Column(name = "is_system_role")
    private Boolean isSystemRole = false;

    /** Date de création */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Date de dernière modification */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Ensemble des permissions associées à ce rôle.
     * Relation ManyToMany via la table de jointure role_permissions.
     */
    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();

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
