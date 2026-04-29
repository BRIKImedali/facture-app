package com.pfe.facturation.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO de réponse pour une facture complète.
 * Contient toutes les informations affichables sur la facture.
 */
public record FactureResponseDTO(
        Long id,
        String numero,
        String statut,
        String dateEmission,
        String dateEcheance,
        String notes,
        String createdByEmail,
        ClientDTO client,
        List<LigneResponseDTO> lignes,
        BigDecimal totalHT,
        BigDecimal totalTva,
        BigDecimal totalTTC,
        String paymentMethod
) {

    /** DTO d'une ligne de facture dans la réponse */
    public record LigneResponseDTO(
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

public String getNumero() {
        return null;
}
}
