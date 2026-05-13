package com.pfe.facturation.dto;

import com.pfe.facturation.entity.StatutDevis;
import jakarta.validation.constraints.NotNull;

public record UpdateStatutDevisRequest(
        @NotNull(message = "Le statut est obligatoire") StatutDevis statut
) {
    // DTO for updating devis status
}
