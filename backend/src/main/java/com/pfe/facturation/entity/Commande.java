package com.pfe.facturation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "commandes")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String reference;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCommande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutCommande statut = StatutCommande.EN_ATTENTE;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalTTC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendeur_id", nullable = false)
    private Vendeur vendeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devis_id")
    private Devis devis;

    @PrePersist
    protected void onCreate() {
        this.dateCommande = LocalDateTime.now();
    }
}
