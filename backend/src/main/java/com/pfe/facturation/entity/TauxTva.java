package com.pfe.facturation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité TauxTva — représente un taux de TVA applicable (0%, 7%, 13%, 19%…).
 * Mappée sur la table "taux_tva" en base de données.
 */
@Entity
@Table(name = "taux_tva")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TauxTva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Valeur numérique du taux (ex: 0.0, 7.0, 13.0, 19.0).
     * Stockée en Double pour les calculs de TVA sur les lignes de facturation.
     */
    @Column(nullable = false)
    private Double valeur;

    /** Libellé descriptif (ex: "Exonéré", "Taux réduit", "Intermédiaire", "Normal") */
    @Column(nullable = false)
    private String description;

    /** Indique si ce taux est disponible dans les formulaires de saisie. */
    @Builder.Default
    @Column(nullable = false)
    private Boolean actif = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
