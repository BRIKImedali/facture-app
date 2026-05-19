package com.pfe.facturation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateBonLivraisonRequest(
        Long commandeId,
        LocalDate dateLivraison,
        String notes,
        List<LigneRequest> lignes
) {
    public record LigneRequest(
            Long produitId,
            String designation,
            Integer quantite,
            BigDecimal prixUnitaireHT,
            Double tauxTva
    ) {}
}
