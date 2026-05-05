package com.pfe.facturation.controller;

import com.pfe.facturation.dto.EmplacementDTO;
import com.pfe.facturation.service.EmplacementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emplacements")
@Tag(name = "Emplacements", description = "Gestion des emplacements (Zone / Rayon / Étagère)")
public class EmplacementController {

    private final EmplacementService emplacementService;

    public EmplacementController(EmplacementService emplacementService) {
        this.emplacementService = emplacementService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Lister tous les emplacements")
    public ResponseEntity<List<EmplacementDTO>> findAll() {
        return ResponseEntity.ok(emplacementService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Récupérer un emplacement par son ID")
    public ResponseEntity<EmplacementDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(emplacementService.findById(id));
    }

    @GetMapping("/site/{siteId}")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Lister les emplacements d'un site")
    public ResponseEntity<List<EmplacementDTO>> findBySite(@PathVariable("siteId") Long siteId) {
        return ResponseEntity.ok(emplacementService.findBySite(siteId));
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Rechercher des emplacements (zone, rayon, étagère)")
    public ResponseEntity<List<EmplacementDTO>> search(@RequestParam(name = "q") String q) {
        return ResponseEntity.ok(emplacementService.search(q));
    }

    @PostMapping
    @PreAuthorize("hasPermission('PRODUIT', 'CREATE')")
    @Operation(summary = "Créer un emplacement")
    public ResponseEntity<EmplacementDTO> create(@Valid @RequestBody EmplacementDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(emplacementService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'UPDATE')")
    @Operation(summary = "Mettre à jour un emplacement")
    public ResponseEntity<EmplacementDTO> update(@PathVariable("id") Long id,
                                                 @Valid @RequestBody EmplacementDTO dto) {
        return ResponseEntity.ok(emplacementService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'DELETE')")
    @Operation(summary = "Supprimer un emplacement")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        emplacementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
