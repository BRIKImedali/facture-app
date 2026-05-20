package com.pfe.facturation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lignes_commande")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LigneCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    @JsonIgnore
    private Commande commande;

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

    /** Remise par ligne en % (0–100). Null = pas de remise sur cette ligne. */
    @Column(name = "remise_ligne", precision = 5, scale = 2)
    private BigDecimal remiseLigne;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantHT;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantTva;

    @Column(precision = 12, scale = 2)
    private BigDecimal montantTTC;
}
