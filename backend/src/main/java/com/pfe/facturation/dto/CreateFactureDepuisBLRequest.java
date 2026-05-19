package com.pfe.facturation.dto;

import java.time.LocalDate;
import java.util.List;

public record CreateFactureDepuisBLRequest(
        Long clientId,
        List<Long> bonLivraisonIds,
        LocalDate dateEcheance,
        String notes,
        String paymentMethod
) {}
