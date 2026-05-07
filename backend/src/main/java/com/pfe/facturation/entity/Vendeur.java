package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

import com.pfe.facturation.security.entity.User;

/**
 * Entité Vendeur — représente un vendeur (commercial) de l'entreprise.
 * Mappée sur la table "vendeurs" en base de données.
 */
@Entity
@Table(name = "vendeurs")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vendeur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du vendeur est obligatoire")
    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Email(message = "Format d'email invalide")
    @Column(unique = true)
    private String email;

    private String telephone;

    private String adresse;

    private String ville;

    @Builder.Default
    private String pays = "Maroc";

    /** Carte d'Identité Nationale */
    @Column(unique = true)
    private String cin;

    /** Numéro d'identification du vendeur dans l'entreprise */
    @Column(unique = true)
    private String matriculeInterne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "util_id")
    private User user;

    /** Commission en pourcentage (ex: 5.0 pour 5%) */
    @Builder.Default
    private Double tauxCommission = 0.0;

    @Builder.Default
    private Boolean actif = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
