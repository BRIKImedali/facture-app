package com.pfe.facturation.dto;

import com.pfe.facturation.entity.StatutFacture;
import jakarta.validation.constraints.NotNull;

/**
 * DTO pour changer le statut d'une facture.
 * Ex: {"statut": "PAYEE"}
 */
public record UpdateStatutRequest(
        @NotNull(message = "Le statut est obligatoire") StatutFacture statut
) {}
