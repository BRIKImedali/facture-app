package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité Client — représente un client de l'entreprise.
 *
 * Changements v2:
 * - Ajout de category (ManyToOne ClientCategory) pour classifier les clients.
 * Mappée sur la table "clients" en base de données.
 */
@Entity
@Table(name = "clients")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du client est obligatoire")
    @Column(nullable = false)
    private String nom;

    @Email(message = "Format d'email invalide")
    @Column(unique = true)
    private String email;

    private String telephone;

    private String adresse;

    private String ville;

    private String codePostal;

    @Builder.Default
    private String pays = "Tunisie";

    /**
     * Identifiant Commun de l'Entreprise (ICE) — numéro fiscal marocain.
     * Equivalent du SIRET pour les entreprises marocaines.
     */
    private String ice;

    /**
     * Catégorie du client (ex: Entreprise, Particulier, Administration).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categorie_id")
    private CategorieClient categorie;

    /**
     * Vendeur responsable du client (optionnel).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendeur_id")
    private Vendeur vendeur;

    /**
     * Devise de facturation du client (optionnel).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "devise_id")
    private Devise devise;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
