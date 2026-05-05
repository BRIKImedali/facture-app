package com.pfe.facturation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * DTO Emplacement — utilisé pour les requêtes et les réponses.
 */
public record EmplacementDTO(
        Long id,

        @NotBlank(message = "La zone est obligatoire")
        String zone,

        String rayon,
        String etagere,

        @NotNull(message = "Le site est obligatoire")
        Long siteId,

        String siteNom,   // lecture seule — nom du site pour l'affichage

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
