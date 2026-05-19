package com.pfe.facturation.controller;

import com.pfe.facturation.dto.BonLivraisonDTO;
import com.pfe.facturation.dto.CreateBonLivraisonRequest;
import com.pfe.facturation.dto.UpdateStatutBonLivraisonRequest;
import com.pfe.facturation.entity.StatutBonLivraison;
import com.pfe.facturation.service.BonLivraisonService;
import com.pfe.facturation.service.PdfService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bons-livraison")
@Tag(name = "Bons de Livraison", description = "Gestion des bons de livraison")
public class BonLivraisonController {

    private final BonLivraisonService blService;
    private final PdfService pdfService;

    public BonLivraisonController(BonLivraisonService blService, PdfService pdfService) {
        this.blService = blService;
        this.pdfService = pdfService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('BON_LIVRAISON', 'READ')")
    @Operation(summary = "Lister tous les bons de livraison")
    public ResponseEntity<List<BonLivraisonDTO>> findAll(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Long commandeId) {
        if (clientId != null) {
            return ResponseEntity.ok(blService.findByClient(clientId));
        }
        if (statut != null) {
            return ResponseEntity.ok(blService.findByStatut(StatutBonLivraison.valueOf(statut.toUpperCase())));
        }
        if (commandeId != null) {
            return ResponseEntity.ok(blService.findByCommande(commandeId));
        }
        return ResponseEntity.ok(blService.findAll());
    }

    @GetMapping("/facturables")
    @PreAuthorize("hasPermission('BON_LIVRAISON', 'READ')")
    @Operation(summary = "BL livrés et non encore facturés pour un client")
    public ResponseEntity<List<BonLivraisonDTO>> findFacturables(@RequestParam Long clientId) {
        return ResponseEntity.ok(blService.findFacturables(clientId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('BON_LIVRAISON', 'READ')")
    @Operation(summary = "Détail d'un bon de livraison")
    public ResponseEntity<BonLivraisonDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(blService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasPermission('BON_LIVRAISON', 'CREATE')")
    @Operation(summary = "Créer un bon de livraison depuis une commande")
    public ResponseEntity<BonLivraisonDTO> create(@RequestBody CreateBonLivraisonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blService.create(request));
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasPermission('BON_LIVRAISON', 'UPDATE')")
    @Operation(summary = "Changer le statut d'un bon de livraison")
    public ResponseEntity<BonLivraisonDTO> updateStatut(
            @PathVariable Long id,
            @RequestBody UpdateStatutBonLivraisonRequest request) {
        return ResponseEntity.ok(blService.updateStatut(id, request));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasPermission('BON_LIVRAISON', 'READ')")
    @Operation(summary = "Télécharger le PDF d'un bon de livraison")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id) {
        try {
            BonLivraisonDTO bl = blService.findById(id);
            byte[] pdfBytes = pdfService.generateBonLivraisonPdf(bl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "BL_" + bl.numero() + ".pdf");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
