package com.pfe.facturation.controller;

import com.pfe.facturation.dto.ProduitDTO;
import com.pfe.facturation.service.ProduitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produits")
@Tag(name = "Produits", description = "Gestion du catalogue de produits / services")
public class ProduitController {

    private final ProduitService produitService;

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    @GetMapping
    @Operation(summary = "Lister tous les produits")
    public ResponseEntity<List<ProduitDTO>> findAll() {
        return ResponseEntity.ok(produitService.findAll());
    }

    @GetMapping("/actifs")
    @Operation(summary = "Lister les produits actifs uniquement")
    public ResponseEntity<List<ProduitDTO>> findActifs() {
        return ResponseEntity.ok(produitService.findActifs());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un produit par son ID")
    public ResponseEntity<ProduitDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(produitService.findById(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des produits")
    public ResponseEntity<List<ProduitDTO>> search(@RequestParam(name = "q") String q) {
        return ResponseEntity.ok(produitService.search(q));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau produit")
    public ResponseEntity<ProduitDTO> create(@Valid @RequestBody ProduitDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produitService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour un produit")
    public ResponseEntity<ProduitDTO> update(@PathVariable("id") Long id,
                                              @Valid @RequestBody ProduitDTO dto) {
        return ResponseEntity.ok(produitService.update(id, dto));
    }

    @PatchMapping("/{id}/desactiver")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Désactiver un produit (soft delete)")
    public ResponseEntity<ProduitDTO> desactiver(@PathVariable("id") Long id) {
        return ResponseEntity.ok(produitService.desactiver(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer définitivement un produit")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        produitService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
