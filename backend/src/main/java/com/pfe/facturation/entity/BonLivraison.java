package com.pfe.facturation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bons_livraison")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BonLivraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String numero;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutBonLivraison statut = StatutBonLivraison.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id")
    private Commande commande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id")
    private Facture facture;

    private LocalDate dateLivraison;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "bonLivraison", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LigneBonLivraison> lignes = new ArrayList<>();

    @Column(precision = 12, scale = 2)
    private BigDecimal totalHT;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalTva;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalTTC;

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
