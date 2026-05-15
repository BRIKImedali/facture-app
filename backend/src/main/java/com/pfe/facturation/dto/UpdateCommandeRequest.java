package com.pfe.facturation.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO de mise à jour complète d'une commande (lignes, remise, notes, date).
 * Utilisable uniquement si statut = EN_ATTENTE.
 */
public record UpdateCommandeRequest(
        LocalDate dateCommande,
        String notes,
        @DecimalMin(value = "0.0") @DecimalMax(value = "100.0") BigDecimal remise,
        @NotEmpty(message = "La commande doit contenir au moins une ligne") List<LigneCommandeRequest> lignes
) {
    public record LigneCommandeRequest(
            Long produitId,
            @NotBlank(message = "La désignation est obligatoire") String designation,
            @Min(1) int quantite,
            BigDecimal prixUnitaireHT,
            Double tauxTva
    ) {}
}
