package com.pfe.facturation.service;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.fasterxml.jackson.dataformat.xml.ser.ToXmlGenerator;
import com.pfe.facturation.dto.FactureXmlDTO;
import com.pfe.facturation.entity.Client;
import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.entity.LigneFacture;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.FactureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service d'export XML des factures.
 * Utilise Jackson XmlMapper pour produire un document XML bien formé.
 */
@Service
@Transactional(readOnly = true)
public class XmlExportService {

    private static final Logger log = LoggerFactory.getLogger(XmlExportService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DT_FMT   = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final FactureRepository factureRepository;
    private final XmlMapper xmlMapper;

    public XmlExportService(FactureRepository factureRepository) {
        this.factureRepository = factureRepository;
        // Configurer XmlMapper pour sortir la déclaration XML <?xml version="1.0"?>
        this.xmlMapper = new XmlMapper();
        this.xmlMapper.configure(ToXmlGenerator.Feature.WRITE_XML_DECLARATION, true);
        this.xmlMapper.enable(com.fasterxml.jackson.databind.SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Exporte une facture en XML structuré.
     *
     * @param id identifiant de la facture
     * @return chaîne XML complète
     * @throws ResourceNotFoundException si la facture n'existe pas
     */
    public String exportFacture(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : id=" + id));

        FactureXmlDTO dto = toXmlDto(facture);

        try {
            String xml = xmlMapper.writeValueAsString(dto);
            log.info("Export XML généré pour la facture {}", facture.getNumero());
            return xml;
        } catch (Exception e) {
            log.error("Erreur lors de la génération XML de la facture {}", id, e);
            throw new RuntimeException("Impossible de générer le fichier XML : " + e.getMessage(), e);
        }
    }

    // ===== Mapping =====

    private FactureXmlDTO toXmlDto(Facture f) {
        return new FactureXmlDTO(
                f.getNumero(),
                f.getStatut() != null ? f.getStatut().name() : null,
                f.getDateEmission() != null ? f.getDateEmission().format(DT_FMT) : null,
                f.getDateEcheance() != null ? f.getDateEcheance().format(DATE_FMT) : null,
                f.getNotes(),
                f.getCreatedBy() != null ? f.getCreatedBy().getUsername() : null,
                toClientInfo(f.getClient()),
                toLignes(f.getLignes()),
                f.getTotalHT(),
                f.getTotalTva(),
                f.getTotalTTC()
        );
    }

    private FactureXmlDTO.ClientInfo toClientInfo(Client c) {
        if (c == null) return null;
        return new FactureXmlDTO.ClientInfo(
                c.getNom(), c.getEmail(), c.getTelephone(),
                c.getAdresse(), c.getVille(), c.getIce()
        );
    }

    private List<FactureXmlDTO.LigneXmlDTO> toLignes(List<LigneFacture> lignes) {
        if (lignes == null) return List.of();
        return lignes.stream()
                .map(l -> new FactureXmlDTO.LigneXmlDTO(
                        l.getDesignation(), l.getQuantite(), l.getPrixUnitaireHT(),
                        l.getTauxTva(), l.getMontantHT(), l.getMontantTva(), l.getMontantTTC()
                ))
                .toList();
    }
}
