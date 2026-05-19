package com.pfe.facturation.dto;

import com.pfe.facturation.entity.StatutCommande;
import jakarta.validation.constraints.NotNull;

public record UpdateStatutCommandeRequest(
        @NotNull(message = "Le statut est obligatoire") StatutCommande statut,

        String paymentMethod       
) {}