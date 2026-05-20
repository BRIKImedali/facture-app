package com.pfe.facturation.entity;

import com.pfe.facturation.security.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Facture — document comptable principal de l'application.
 *
 * Changements v2:
 * - Ajout de paymentMethod (PaymentMethod enum) pour le mode de paiement.
 *   Stocké en STRING pour la lisibilité en base.
 *
 * Chaque facture est liée à :
 *  - Un Client (le destinataire)
 *  - Un User (le créateur)
 *  - Plusieurs LignesFacture (les produits/services facturés)
 *
 * Les totaux (HT, TVA, TTC) sont calculés et persistés pour les rapports.
 */
@Entity
@Table(name = "factures")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Numéro unique de facture au format FAC-YYYY-XXXX.
     * Généré automatiquement par FactureService après persistence.
     */
    @Column(unique = true)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    /** Utilisateur qui a créé la facture */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User createdBy;

    /** Commande source (nullable — renseigné si créée depuis une commande) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id")
    private Commande commande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutFacture statut = StatutFacture.BROUILLON;

    /**
     * Mode de paiement de la facture.
     * Valeurs : ESPECES (cash), VIREMENT (bank transfer), CHEQUE (check).
     * Null si non encore défini (facture en brouillon).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_facture", length = 20)
    @Builder.Default
    private TypeFacture type = TypeFacture.CLASSIQUE;

    /** Date de création / émission de la facture */
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateEmission;

    /** Date d'échéance de paiement (optionnelle) */
    private LocalDate dateEcheance;

    /** Remarques ou conditions de paiement libres */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LigneFacture> lignes = new ArrayList<>();

    // ===== Totaux calculés et persistés =====

    /** Remise globale en pourcentage (0–100). Null = pas de remise. */
    @Column(precision = 5, scale = 2)
    private BigDecimal remise;

    /** Total Hors Taxes (somme des montants HT de toutes les lignes) */
    @Column(precision = 12, scale = 2)
    private BigDecimal totalHT;

    /** Total HT après application de la remise : totalHT * (1 - remise/100) */
    @Column(precision = 12, scale = 2)
    private BigDecimal totalHT_apres_remise;

    /** Total de la TVA (calculé sur totalHT_apres_remise) */
    @Column(precision = 12, scale = 2)
    private BigDecimal totalTva;

    /** Total TTC = totalHT_apres_remise + totalTva */
    @Column(precision = 12, scale = 2)
    private BigDecimal totalTTC;

    @PrePersist
    protected void onCreate() {
        this.dateEmission = LocalDateTime.now();
    }
}
