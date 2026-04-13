package com.pfe.facturation.security.entity;

import com.pfe.facturation.model.AppRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Entité User — mise à jour pour supporter le système de permissions granulaires.
 * 
 * Nouveaux champs ajoutés :
 * - isActive : pour activer/désactiver un compte utilisateur
 * - appRoles : relation ManyToMany avec les rôles applicatifs (AppRole)
 * - createdAt, updatedAt : timestamps
 * 
 * L'enum Role existant (ADMIN/USER) est conservé pour compatibilité ascendante.
 * Les nouvelles permissions sont gérées via appRoles → permissions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * Statut actif/inactif du compte.
     * Un compte inactif ne peut pas se connecter.
     */
    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    /**
     * Rôles applicatifs du module d'administration.
     * Chargés EAGER pour vérification des permissions lors de chaque requête.
     * La table user_roles est créée via @JoinTable.
     */
    @Builder.Default
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<AppRole> appRoles = new ArrayList<>();

    /** Date de création du compte */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Date de dernière modification */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Timestamp de dernière connexion */
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ===== Méthodes requises par UserDetails =====

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Autorités de base depuis l'enum Role (compatibilité existante)
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));

        // Ajouter toutes les permissions granulaires depuis les appRoles
        if (appRoles != null) {
            appRoles.stream()
                .filter(ar -> ar.getPermissions() != null)
                .flatMap(ar -> ar.getPermissions().stream())
                .map(p -> new SimpleGrantedAuthority(p.getPermissionString()))
                .forEach(authorities::add);
        }

        return authorities;
    }

    /**
     * Vérifie si l'utilisateur possède une permission spécifique.
     * Format : ENTITY:ACTION (ex: FACTURE:CREATE)
     */
    public boolean hasPermission(String permissionString) {
        if (appRoles == null) return false;
        return appRoles.stream()
            .filter(ar -> ar.getPermissions() != null)
            .flatMap(ar -> ar.getPermissions().stream())
            .anyMatch(p -> p.getPermissionString().equals(permissionString));
    }

    /**
     * Retourne la liste de toutes les permissions de l'utilisateur.
     */
    public List<String> getAllPermissions() {
        if (appRoles == null) return new ArrayList<>();
        return appRoles.stream()
            .filter(ar -> ar.getPermissions() != null)
            .flatMap(ar -> ar.getPermissions().stream())
            .map(p -> p.getPermissionString())
            .distinct()
            .collect(Collectors.toList());
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return isActive != null ? isActive : true;
    }
}
