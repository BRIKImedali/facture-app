package com.pfe.facturation.dto;

import java.math.BigDecimal;
import java.util.List;

public record BonLivraisonDTO(
        Long id,
        String numero,
        String statut,
        String dateCreation,
        String dateLivraison,
        String notes,
        Long commandeId,
        String commandeReference,
        ClientDTO client,
        Long factureId,
        String factureNumero,
        List<LigneBonLivraisonDTO> lignes,
        BigDecimal totalHT,
        BigDecimal totalTva,
        BigDecimal totalTTC
) {
    public record LigneBonLivraisonDTO(
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
