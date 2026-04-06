package com.pfe.facturation.security.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Entité User — mappée sur la table "users" en base de données.
 *
 * IMPORTANT : Cette classe implémente UserDetails (interface Spring Security).
 * Cela permet à Spring Security de gérer directement cette entité pour
 * l'authentification, sans classe intermédiaire.
 *
 * @Builder : permet de créer un User avec le pattern Builder (plus lisible)
 *   → User.builder().email("...").password("...").role(Role.USER).build()
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
    private String password; // Stocké hashé avec BCrypt (jamais en clair)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // ===== Méthodes requises par UserDetails =====

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // On transforme le rôle en liste d'autorités Spring Security
        // "ROLE_" est le préfixe convention Spring Security
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email; // On utilise l'email comme identifiant unique
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
