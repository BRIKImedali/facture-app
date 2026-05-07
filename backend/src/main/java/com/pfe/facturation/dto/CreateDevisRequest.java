package com.pfe.facturation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateDevisRequest(
        @NotNull(message = "Le client est obligatoire") Long clientId,
        LocalDate dateExpiration,
        String notes,
        @NotEmpty(message = "Le devis doit contenir au moins une ligne") List<LigneDevisRequest> lignes
) {
    public record LigneDevisRequest(
            Long produitId,
            @NotBlank(message = "La désignation est obligatoire") String designation,
            @NotNull @Min(1) Integer quantite,
            @NotNull BigDecimal prixUnitaireHT,
            @NotNull Double tauxTva
    ) {}
}
