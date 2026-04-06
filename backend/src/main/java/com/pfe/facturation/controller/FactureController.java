package com.pfe.facturation.controller;

import com.pfe.facturation.dto.CreateFactureRequest;
import com.pfe.facturation.dto.FactureResponseDTO;
import com.pfe.facturation.dto.UpdateStatutRequest;
import com.pfe.facturation.entity.StatutFacture;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.service.EmailService;
import com.pfe.facturation.service.FactureService;
import com.pfe.facturation.service.PdfService;
import com.pfe.facturation.service.XmlExportService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
@Tag(name = "Factures", description = "Gestion des factures")
public class FactureController {

    private final FactureService factureService;
    private final PdfService pdfService;
    private final XmlExportService xmlExportService;
    private final EmailService emailService;

    public FactureController(FactureService factureService, PdfService pdfService,
                             XmlExportService xmlExportService, EmailService emailService) {
        this.factureService = factureService;
        this.pdfService = pdfService;
        this.xmlExportService = xmlExportService;
        this.emailService = emailService;
    }

    @GetMapping
    @Operation(summary = "Lister toutes les factures")
    public ResponseEntity<?> findAll(
            @RequestParam(name = "statut", required = false) String statut) {
        if (statut != null) {
            return ResponseEntity.ok(factureService.findByStatut(StatutFacture.valueOf(statut.toUpperCase())));
        }
        return ResponseEntity.ok(factureService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une facture par son ID")
    public ResponseEntity<FactureResponseDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(factureService.findById(id));
    }

    @GetMapping("/client/{clientId}")
    @Operation(summary = "Lister les factures d'un client")
    public ResponseEntity<List<FactureResponseDTO>> findByClient(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(factureService.findByClient(clientId));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques pour le tableau de bord")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(factureService.getDashboardStats());
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle facture")
    public ResponseEntity<FactureResponseDTO> create(
            @Valid @RequestBody CreateFactureRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(factureService.create(request, currentUser));
    }

    @PatchMapping("/{id}/statut")
    @Operation(summary = "Changer le statut d'une facture (ex: ENVOYEE, PAYEE, ANNULEE)")
    public ResponseEntity<FactureResponseDTO> updateStatut(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateStatutRequest request) {
        return ResponseEntity.ok(factureService.updateStatut(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une facture (impossible si PAYEE)")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        factureService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Générer la facture en PDF")
    public ResponseEntity<byte[]> generatePdf(@PathVariable("id") Long id) {
        try {
            FactureResponseDTO facture = factureService.findById(id);
            byte[] pdfBytes = pdfService.generateFacturePdf(facture);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Facture_" + facture.numero() + ".pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/{id}/export-xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Exporter la facture au format XML structuré")
    public ResponseEntity<String> exportXml(@PathVariable("id") Long id) {
        String xmlContent = xmlExportService.exportFacture(id);
        FactureResponseDTO facture = factureService.findById(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_XML);
        headers.setContentDispositionFormData("attachment", "Facture_" + facture.numero() + ".xml");
        return new ResponseEntity<>(xmlContent, headers, HttpStatus.OK);
    }

    /** Alias pour compatibilité avec l'ancien endpoint /xml */
    @GetMapping(value = "/{id}/xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Alias export XML (compatibilité)")
    public ResponseEntity<String> exportXmlAlias(@PathVariable("id") Long id) {
        return exportXml(id);
    }

    @PostMapping("/{id}/send-email")
    @Operation(summary = "Envoyer la facture par email au client")
    public ResponseEntity<Map<String, String>> sendEmail(@PathVariable("id") Long id) {
        try {
            FactureResponseDTO facture = factureService.findById(id);
            emailService.sendFactureEmail(facture);
            return ResponseEntity.ok(Map.of(
                "message", "Email envoyé avec succès à " + facture.client().email()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de l'envoi de l'email : " + e.getMessage()));
        }
    }
}
