package com.pfe.facturation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO Devise — utilisé pour les requêtes (création / mise à jour) ET les réponses.
 */
public record DeviseDTO(
        Long id,
        @NotBlank(message = "Le code de la devise est obligatoire")
        @Size(max = 10, message = "Le code ne peut pas dépasser 10 caractères")
        String code,
        @NotBlank(message = "Le symbole est obligatoire")
        String symbole,
        @NotBlank(message = "Le nom de la devise est obligatoire")
        String nom,
        Boolean actif,
        LocalDateTime createdAt
) {}
