package com.pfe.facturation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO Client — utilisé pour les requêtes (création / mise à jour) ET les réponses.
 * Le champ 'id' est null pour les créations, renseigné dans les réponses.
 */
public record ClientDTO(
        Long id,
        @NotBlank(message = "Le nom du client est obligatoire") String nom,
        @Email(message = "Format d'email invalide") String email,
        String telephone,
        String adresse,
        String ville,
        String codePostal,
        String pays,
        String ice,
        java.util.List<Long> categorieIds
) {}
