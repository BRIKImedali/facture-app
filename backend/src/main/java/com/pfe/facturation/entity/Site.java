package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Site — représente un site géographique de l'entreprise.
 * Chaque produit (Stock / Emplacement) est rattaché à un site.
 */
@Entity
@Table(name = "sites")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du site est obligatoire")
    @Column(nullable = false)
    private String nom;

    private String adresse;

    @NotBlank(message = "La ville est obligatoire")
    @Column(nullable = false)
    private String ville;

    @Column(name = "code_postal")
    private String codePostal;

    @Builder.Default
    private String pays = "France";

    /** Nom du responsable du site */
    private String responsable;

    private String telephone;

    // ── Relations ──────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Emplacement> emplacements = new ArrayList<>();

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Stock> stocks = new ArrayList<>();

    // ── Timestamps ─────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
