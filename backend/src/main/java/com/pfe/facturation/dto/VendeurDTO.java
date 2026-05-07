package com.pfe.facturation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO Vendeur — utilisé pour les requêtes (création / mise à jour) ET les réponses.
 */
public record VendeurDTO(
        Long id,
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "Le prénom est obligatoire") String prenom,
        @Email(message = "Format d'email invalide") String email,
        String telephone,
        String adresse,
        String ville,
        String pays,
        String cin,
        String matriculeInterne,
        Long userId,
        Double tauxCommission,
        Boolean actif
) {}
