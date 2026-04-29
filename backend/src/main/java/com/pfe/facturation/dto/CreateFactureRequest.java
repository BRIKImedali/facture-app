package com.pfe.facturation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO de création d'une facture.
 * Envoyé par le frontend lors de la création d'une nouvelle facture.
 */
public record CreateFactureRequest(
        @NotNull(message = "Le client est obligatoire") Long clientId,
        LocalDate dateEcheance,
        String notes,
        String paymentMethod,
        @NotEmpty(message = "La facture doit contenir au moins une ligne") List<LigneRequest> lignes
) {

    /**
     * Une ligne de la facture à créer.
     * Le produitId est optionnel (si saisie manuelle de la désignation).
     */
    public record LigneRequest(
            Long produitId,
            @NotBlank(message = "La désignation est obligatoire") String designation,
            @NotNull @Min(1) Integer quantite,
            @NotNull BigDecimal prixUnitaireHT,
            @NotNull Double tauxTva
    ) {}
}
