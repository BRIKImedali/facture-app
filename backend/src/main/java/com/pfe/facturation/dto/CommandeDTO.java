package com.pfe.facturation.dto;

import java.math.BigDecimal;
import java.util.List;

public record CommandeDTO(
        Long id,
        String reference,
        String statut,
        String dateCommande,
        BigDecimal totalTTC,
        ClientDTO client,
        VendeurDTO vendeur,
        SiteDTO site,
        Long devisId,
        String notes,
        List<LigneCommandeDTO> lignes
) {
    public record LigneCommandeDTO(
            Long id,
            Long produitId,
            String designation,
            Integer quantite,
            BigDecimal prixUnitaireHT,
            Double tauxTva,
            BigDecimal montantHT,
            BigDecimal montantTva,
            BigDecimal montantTTC
    ) {}
}
