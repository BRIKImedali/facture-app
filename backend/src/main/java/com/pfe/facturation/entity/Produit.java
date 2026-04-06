package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entité Produit — représente un produit ou service facturable.
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
    @Column(nullable = false)
    private Double tauxTva = 20.0;

    /** Unité de mesure : "unité", "heure", "jour", "kg", "mois"... */
    @Builder.Default
    private String unite = "unité";

    /** Produit actif = disponible pour la facturation */
    @Builder.Default
    @Column(nullable = false)
    private Boolean actif = true;
}
