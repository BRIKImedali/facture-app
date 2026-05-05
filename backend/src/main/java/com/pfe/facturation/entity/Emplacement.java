package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Emplacement — représente un emplacement physique dans un site.
 * Structure hiérarchique : Zone → Rayon → Étagère
 */
@Entity
@Table(name = "emplacements")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Emplacement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La zone est obligatoire")
    @Column(nullable = false)
    private String zone;

    private String rayon;

    private String etagere;

    // ── Relations ──────────────────────────────────────────────────────────────

    @NotNull(message = "Le site est obligatoire")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @OneToMany(mappedBy = "emplacement", cascade = CascadeType.ALL, orphanRemoval = true)
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
