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

    @Column(precision = 12, scale = 2)
    private BigDecimal totalHT;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalTva;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalTTC;

    @PrePersist
    protected void onCreate() {
        this.dateDevis = LocalDateTime.now();
    }
}
