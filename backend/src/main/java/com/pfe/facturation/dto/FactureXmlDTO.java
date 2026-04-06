package com.pfe.facturation.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO dédié à l'export XML d'une facture.
 * Utilise les annotations Jackson XML pour produire un document bien structuré.
 */
@JacksonXmlRootElement(localName = "Facture")
public record FactureXmlDTO(

        @JacksonXmlProperty(localName = "Numero")
        String numero,

        @JacksonXmlProperty(localName = "Statut")
        String statut,

        @JacksonXmlProperty(localName = "DateEmission")
        String dateEmission,

        @JacksonXmlProperty(localName = "DateEcheance")
        String dateEcheance,

        @JacksonXmlProperty(localName = "Notes")
        String notes,

        @JacksonXmlProperty(localName = "CreePar")
        String creePar,

        @JacksonXmlProperty(localName = "Client")
        ClientInfo client,

        @JacksonXmlElementWrapper(localName = "Lignes")
        @JacksonXmlProperty(localName = "Ligne")
        List<LigneXmlDTO> lignes,

        @JacksonXmlProperty(localName = "TotalHT")
        BigDecimal totalHT,

        @JacksonXmlProperty(localName = "TotalTVA")
        BigDecimal totalTva,

        @JacksonXmlProperty(localName = "TotalTTC")
        BigDecimal totalTTC
) {

    /** Informations client embarquées dans le XML */
    public record ClientInfo(
            @JacksonXmlProperty(localName = "Nom")      String nom,
            @JacksonXmlProperty(localName = "Email")    String email,
            @JacksonXmlProperty(localName = "Telephone") String telephone,
            @JacksonXmlProperty(localName = "Adresse")  String adresse,
            @JacksonXmlProperty(localName = "Ville")    String ville,
            @JacksonXmlProperty(localName = "ICE")      String ice
    ) {}

    /** Une ligne de facture dans le XML */
    public record LigneXmlDTO(
            @JacksonXmlProperty(localName = "Designation")     String designation,
            @JacksonXmlProperty(localName = "Quantite")        int quantite,
            @JacksonXmlProperty(localName = "PrixUnitaireHT")  BigDecimal prixUnitaireHT,
            @JacksonXmlProperty(localName = "TauxTVA")         double tauxTva,
            @JacksonXmlProperty(localName = "MontantHT")       BigDecimal montantHT,
            @JacksonXmlProperty(localName = "MontantTVA")      BigDecimal montantTva,
            @JacksonXmlProperty(localName = "MontantTTC")      BigDecimal montantTTC
    ) {}
}
