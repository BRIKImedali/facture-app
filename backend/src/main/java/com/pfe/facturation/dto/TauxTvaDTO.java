package com.pfe.facturation.dto;

import java.time.LocalDateTime;

/**
 * DTO (record) pour TauxTva.
 *
 * @param id          Identifiant unique (null lors de la création)
 * @param valeur      Taux en pourcentage (ex: 0.0, 7.0, 13.0, 19.0)
 * @param description Libellé descriptif (ex: "Exonéré", "Taux réduit")
 * @param actif       true si le taux est disponible dans les formulaires
 * @param createdAt   Date de création (en lecture seule)
 */
public record TauxTvaDTO(
        Long id,
        Double valeur,
        String description,
        Boolean actif,
        LocalDateTime createdAt
) {}
