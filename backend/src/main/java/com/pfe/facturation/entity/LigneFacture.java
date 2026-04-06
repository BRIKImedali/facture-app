package com.pfe.facturation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entité LigneFacture — représente une ligne dans une facture.
 *
 * Chaque ligne correspond à un produit/service avec sa quantité et son prix.
 * Les montants (HT, TVA, TTC) sont calculés par FactureService avant persistance.
 */
@Entity
@Table(name = "lignes_facture")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * La facture parente — @JsonIgnore évite la sérialisation circulaire JSON.
     * (Facture contient une liste de LigneFacture, LigneFacture pointe vers Facture)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    @JsonIgnore
    private Facture facture;

    /**
     * Référence au produit du catalogue (optionnelle).
     * La désignation peut différer du nom produit (ex: personnalisation).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    /** Description affichée sur la facture */
    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private Integer quantite;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prixUnitaireHT;

    /** Taux de TVA pour cette ligne (en %, ex: 20.0) */
    @Column(nullable = false)
    private Double tauxTva;

    // ===== Montants calculés =====

    /** montantHT = quantite × prixUnitaireHT */
    @Column(precision = 12, scale = 2)
    private BigDecimal montantHT;

    /** montantTva = montantHT × tauxTva / 100 */
    @Column(precision = 12, scale = 2)
    private BigDecimal montantTva;

    /** montantTTC = montantHT + montantTva */
    @Column(precision = 12, scale = 2)
    private BigDecimal montantTTC;
}
