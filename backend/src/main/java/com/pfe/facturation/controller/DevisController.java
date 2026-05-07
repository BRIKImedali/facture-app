package com.pfe.facturation.controller;

import com.pfe.facturation.dto.DevisDTO;
import com.pfe.facturation.dto.CreateDevisRequest;
import com.pfe.facturation.dto.UpdateStatutDevisRequest;
import com.pfe.facturation.entity.StatutDevis;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.service.DevisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devis")
@Tag(name = "Devis", description = "Gestion des devis")
public class DevisController {

    private final DevisService devisService;

    public DevisController(DevisService devisService) {
        this.devisService = devisService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('DEVIS', 'READ')")
    @Operation(summary = "Lister tous les devis")
    public ResponseEntity<List<DevisDTO>> findAll(
            @RequestParam(name = "statut", required = false) String statut) {
        if (statut != null) {
            return ResponseEntity.ok(devisService.findByStatut(StatutDevis.valueOf(statut.toUpperCase())));
        }
        return ResponseEntity.ok(devisService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('DEVIS', 'READ')")
    @Operation(summary = "Récupérer un devis par son ID")
    public ResponseEntity<DevisDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(devisService.findById(id));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasPermission('DEVIS', 'READ')")
    @Operation(summary = "Lister les devis d'un client")
    public ResponseEntity<List<DevisDTO>> findByClient(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(devisService.findByClient(clientId));
    }

    @PostMapping
    @PreAuthorize("hasPermission('DEVIS', 'CREATE')")
    @Operation(summary = "Créer un nouveau devis")
    public ResponseEntity<DevisDTO> create(
            @Valid @RequestBody CreateDevisRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(devisService.create(request, currentUser));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasPermission('DEVIS', 'UPDATE')")
    @Operation(summary = "Changer le statut d'un devis")
    public ResponseEntity<DevisDTO> updateStatut(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateStatutDevisRequest request) {
        return ResponseEntity.ok(devisService.updateStatut(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('DEVIS', 'DELETE')")
    @Operation(summary = "Supprimer un devis")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        devisService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
