package com.pfe.facturation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * DTO Site — utilisé pour les requêtes et les réponses.
 */
public record SiteDTO(
        Long id,

        @NotBlank(message = "Le nom du site est obligatoire")
        String nom,

        String adresse,

        @NotBlank(message = "La ville est obligatoire")
        String ville,

        String codePostal,
        String pays,
        String responsable,
        String telephone,

        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
