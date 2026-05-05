package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entité Stock — lie un produit à un site et un emplacement.
 * Déclenche une alerte si quantite < seuilMinimum.
 */
@Entity
@Table(name = "stocks",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_stock_produit_site_emplacement",
           columnNames = {"produit_id", "site_id", "emplacement_id"}))
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Relations ──────────────────────────────────────────────────────────────

    @NotNull(message = "Le produit est obligatoire")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produit_id", nullable = false)
    private Produit produit;

    @NotNull(message = "Le site est obligatoire")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "emplacement_id")
    private Emplacement emplacement;

    // ── Quantités ──────────────────────────────────────────────────────────────

    @Builder.Default
    @Min(value = 0, message = "La quantité ne peut pas être négative")
    @Column(nullable = false)
    private Integer quantite = 0;

    @Builder.Default
    @Min(value = 0, message = "Le seuil minimum ne peut pas être négatif")
    @Column(name = "seuil_minimum", nullable = false)
    private Integer seuilMinimum = 0;

    // ── Timestamps ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Retourne true si le stock est en dessous ou égal au seuil minimum. */
    @Transient
    public boolean isEnAlerte() {
        return quantite <= seuilMinimum;
    }
}
