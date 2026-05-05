package com.pfe.facturation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * DTO Stock — utilisé pour les requêtes et les réponses.
 * Le champ {@code enAlerte} est calculé (quantite <= seuilMinimum).
 */
public record StockDTO(
        Long id,

        @NotNull(message = "Le produit est obligatoire")
        Long produitId,
        String produitNom,       // lecture seule

        @NotNull(message = "Le site est obligatoire")
        Long siteId,
        String siteNom,          // lecture seule

        Long emplacementId,
        String emplacementLabel, // lecture seule — "Zone / Rayon / Étagère"

        @Min(value = 0, message = "La quantité ne peut pas être négative")
        Integer quantite,

        @Min(value = 0, message = "Le seuil minimum ne peut pas être négatif")
        Integer seuilMinimum,

        Boolean enAlerte,        // calculé côté service

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
