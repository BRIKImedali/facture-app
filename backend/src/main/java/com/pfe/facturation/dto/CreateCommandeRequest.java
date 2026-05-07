package com.pfe.facturation.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateCommandeRequest(
        @NotNull(message = "Le client est obligatoire") Long clientId,
        @NotNull(message = "Le vendeur est obligatoire") Long vendeurId,
        @NotNull(message = "Le site est obligatoire") Long siteId,
        @NotNull(message = "Le produit est obligatoire") Long produitId,
        Long devisId,
        @NotNull(message = "Le total TTC est obligatoire") BigDecimal totalTTC
) {}
