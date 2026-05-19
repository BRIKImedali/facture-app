package com.pfe.facturation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lignes_bon_livraison")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneBonLivraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_livraison_id", nullable = false)
    @JsonIgnore
    private BonLivraison bonLivraison;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private Integer quantite;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prixUnitaireHT;

    @Column(nullable = false)
    private Double tauxTva;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantHT;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantTva;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantTTC;
}
