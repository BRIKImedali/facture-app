package com.pfe.facturation.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateCommandeRequest(
        @NotNull(message = "Le client est obligatoire") Long clientId,
        @NotNull(message = "Le vendeur est obligatoire") Long vendeurId,
        @NotNull(message = "Le site est obligatoire") Long siteId,
        /** ID du devis d'origine (optionnel — commande créable sans devis). */
        Long devisId,
        LocalDate dateCommande,
        String notes,
        /** Remise en % (0 à 100). Optionnel, null = aucune remise. */
        @DecimalMin(value = "0.0") @DecimalMax(value = "100.0") BigDecimal remise,
        /** Mode de paiement : ESPECES, VIREMENT, CHEQUE. Optionnel. */
        String paymentMethod,          // ← NOUVEAU
        @NotEmpty(message = "La commande doit contenir au moins une ligne") List<LigneCommandeRequest> lignes
) {
    public record LigneCommandeRequest(
            Long produitId,
            @NotBlank(message = "La désignation est obligatoire") String designation,
            @NotNull @Min(1) Integer quantite,
            @NotNull BigDecimal prixUnitaireHT,
            @NotNull Double tauxTva,
            @DecimalMin(value = "0.0") @DecimalMax(value = "100.0") BigDecimal remiseLigne
    ) {}
}