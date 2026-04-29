package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entité Produit — représente un produit ou service facturable.
 *
 * Changements v2:
 * - unite: String → ManyToOne Unite (entité dédiée)
 * - ajout stockQuantite (quantité en stock actuelle)
 * - ajout stockMinimum (seuil d'alerte de stock bas)
 * Mappée sur la table "produits".
 */
@Entity
@Table(name = "produits")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Référence interne du produit (ex: PROD-001) */
    private String reference;

    @NotBlank(message = "Le nom du produit est obligatoire")
    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Le prix HT est obligatoire")
    @DecimalMin(value = "0.0", message = "Le prix doit être positif ou nul")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prixHT;

    /**
     * Taux de TVA appliqué à ce produit, en pourcentage.
     * Exemples : 20.0 (taux normal), 10.0 (taux réduit), 0.0 (exonéré)
     */
    @Builder.Default
    private Double tauxTva = 20.0;

    /**
     * Unité de mesure — entité dédiée pour permettre la gestion centralisée.
     * ManyToOne optionnel (nullable) pour compatibilité ascendante.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "unite_id")
    private Unite unite;

    /**
     * Quantité actuellement disponible en stock.
     * Décrémentée lors de la validation d'une facture (statut VALIDEE).
     * null = gestion de stock non activée pour ce produit.
     */
    @Builder.Default
    @Column(name = "stock_quantite")
    private Integer stockQuantite = 0;

    /**
     * Seuil minimal de stock — en dessous de cette valeur, une alerte est déclenchée.
     * 0 = pas d'alerte.
     */
    @Builder.Default
    @Column(name = "stock_minimum")
    private Integer stockMinimum = 0;

    /** Produit actif = disponible pour la facturation */
    @Builder.Default
    private Boolean actif = true;
}
