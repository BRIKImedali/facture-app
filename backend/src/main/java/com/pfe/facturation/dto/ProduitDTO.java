package com.pfe.facturation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * DTO Produit — utilisé pour les requêtes et les réponses.
 */
public record ProduitDTO(
        Long id,
        String reference,
        @NotBlank(message = "Le nom du produit est obligatoire") String nom,
        String description,
        @NotNull(message = "Le prix HT est obligatoire")
        @DecimalMin(value = "0.0", message = "Le prix doit être positif") BigDecimal prixHT,
        Double tauxTva,
        String unite,
        Boolean actif
) {}
