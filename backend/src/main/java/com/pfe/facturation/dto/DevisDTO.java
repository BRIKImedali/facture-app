package com.pfe.facturation.dto;

import java.math.BigDecimal;
import java.util.List;

public record DevisDTO(
        Long id,
        String reference,
        String statut,
        String dateDevis,
        String dateExpiration,
        String notes,
        String createdBy,
        ClientDTO client,
        List<LigneDevisDTO> lignes,
        BigDecimal totalHT,
        BigDecimal remise,
        BigDecimal totalHT_apres_remise,
        BigDecimal totalTva,
        BigDecimal totalTTC
) {
    public record LigneDevisDTO(
            Long id,
            String designation,
            Integer quantite,
            BigDecimal prixUnitaireHT,
            Double tauxTva,
            BigDecimal montantHT,
            BigDecimal montantTva,
            BigDecimal montantTTC,
            Long produitId
    ) {}
}
