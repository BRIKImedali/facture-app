package com.pfe.facturation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    /**
     * Mode de paiement de la commande.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    /** Remise globale en pourcentage (0–100). Null = pas de remise. */
    @Column(precision = 5, scale = 2)
    private BigDecimal remise;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalHT;

    /** Total HT après application de la remise : totalHT * (1 - remise/100) */
    @Column(precision = 12, scale = 2)
    private BigDecimal totalHT_apres_remise;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalTva;

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

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneCommande> lignes = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devis_id")
    private Devis devis;

    @PrePersist
    protected void onCreate() {
        if (this.dateCommande == null) {
            this.dateCommande = LocalDateTime.now();
        }
    }
}