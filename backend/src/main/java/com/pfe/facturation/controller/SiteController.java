package com.pfe.facturation.controller;

import com.pfe.facturation.dto.SiteDTO;
import com.pfe.facturation.service.SiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
@Tag(name = "Sites", description = "Gestion des sites géographiques")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Lister tous les sites")
    public ResponseEntity<List<SiteDTO>> findAll() {
        return ResponseEntity.ok(siteService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Récupérer un site par son ID")
    public ResponseEntity<SiteDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(siteService.findById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Rechercher des sites (nom, ville, responsable)")
    public ResponseEntity<List<SiteDTO>> search(@RequestParam(name = "q") String q) {
        return ResponseEntity.ok(siteService.search(q));
    }

    @PostMapping
    @PreAuthorize("hasPermission('PRODUIT', 'CREATE')")
    @Operation(summary = "Créer un nouveau site")
    public ResponseEntity<SiteDTO> create(@Valid @RequestBody SiteDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'UPDATE')")
    @Operation(summary = "Mettre à jour un site")
    public ResponseEntity<SiteDTO> update(@PathVariable("id") Long id,
                                          @Valid @RequestBody SiteDTO dto) {
        return ResponseEntity.ok(siteService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'DELETE')")
    @Operation(summary = "Supprimer un site")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        siteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
