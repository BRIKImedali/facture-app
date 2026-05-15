package com.pfe.facturation.entity;

import com.pfe.facturation.security.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "devis")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Devis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDevis statut = StatutDevis.BROUILLON;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dateDevis;

    private LocalDate dateExpiration;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "devis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LigneDevis> lignes = new ArrayList<>();

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

    @PrePersist
    protected void onCreate() {
        this.dateDevis = LocalDateTime.now();
    }
}
