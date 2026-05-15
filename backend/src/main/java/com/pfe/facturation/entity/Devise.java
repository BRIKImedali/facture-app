package com.pfe.facturation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité Devise — représente une devise monétaire (USD, EUR, GBP, MAD…).
 * Mappée sur la table "devises" en base de données.
 */
@Entity
@Table(name = "devises")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Devise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Code ISO 4217 (ex: "USD", "EUR", "MAD") */
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    /** Symbole (ex: "$", "€", "د.م.") */
    @Column(nullable = false, length = 10)
    private String symbole;

    /** Nom complet (ex: "Dollar américain", "Euro") */
    @Column(nullable = false)
    private String nom;

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
