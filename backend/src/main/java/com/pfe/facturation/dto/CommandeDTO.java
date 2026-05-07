package com.pfe.facturation.dto;

import java.math.BigDecimal;

public record CommandeDTO(
        Long id,
        String reference,
        String statut,
        String dateCommande,
        BigDecimal totalTTC,
        ClientDTO client,
        VendeurDTO vendeur,
        SiteDTO site,
        ProduitDTO produit,
        Long devisId
) {}
