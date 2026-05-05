package com.pfe.facturation.controller;

import com.pfe.facturation.dto.StockDTO;
import com.pfe.facturation.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@Validated
@Tag(name = "Stocks", description = "Gestion des stocks par site et emplacement")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    // ── Lecture ────────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Lister tous les stocks")
    public ResponseEntity<List<StockDTO>> findAll() {
        return ResponseEntity.ok(stockService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Récupérer un stock par son ID")
    public ResponseEntity<StockDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(stockService.findById(id));
    }

    @GetMapping("/produit/{produitId}")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Stocks d'un produit donné")
    public ResponseEntity<List<StockDTO>> findByProduit(@PathVariable("produitId") Long produitId) {
        return ResponseEntity.ok(stockService.findByProduit(produitId));
    }

    @GetMapping("/site/{siteId}")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Stocks d'un site donné")
    public ResponseEntity<List<StockDTO>> findBySite(@PathVariable("siteId") Long siteId) {
        return ResponseEntity.ok(stockService.findBySite(siteId));
    }

    /**
     * GET /api/stocks/alertes            → tous les stocks en alerte
     * GET /api/stocks/alertes?siteId=2   → alertes filtrées par site
     */
    @GetMapping("/alertes")
    @PreAuthorize("hasPermission('PRODUIT', 'READ')")
    @Operation(summary = "Stocks en alerte de réapprovisionnement (quantite ≤ seuilMinimum)")
    public ResponseEntity<List<StockDTO>> findAlertes(
            @RequestParam(name = "siteId", required = false) Long siteId) {
        return ResponseEntity.ok(stockService.findAlertes(siteId));
    }

    // ── Écriture ───────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasPermission('PRODUIT', 'CREATE')")
    @Operation(summary = "Créer une entrée de stock")
    public ResponseEntity<StockDTO> create(@Valid @RequestBody StockDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'UPDATE')")
    @Operation(summary = "Mettre à jour un stock")
    public ResponseEntity<StockDTO> update(@PathVariable("id") Long id,
                                           @Valid @RequestBody StockDTO dto) {
        return ResponseEntity.ok(stockService.update(id, dto));
    }

    /**
     * PATCH /api/stocks/{id}/entree?quantite=10
     * Ajoute {@code quantite} unités au stock existant.
     */
    @PatchMapping("/{id}/entree")
    @PreAuthorize("hasPermission('PRODUIT', 'UPDATE')")
    @Operation(summary = "Enregistrer une entrée de stock (ajout de quantité)")
    public ResponseEntity<StockDTO> entree(
            @PathVariable("id") Long id,
            @RequestParam(name = "quantite") @Min(1) int quantite) {
        return ResponseEntity.ok(stockService.entree(id, quantite));
    }

    /**
     * PATCH /api/stocks/{id}/sortie?quantite=5
     * Déduit {@code quantite} unités du stock. Refuse si stock insuffisant.
     */
    @PatchMapping("/{id}/sortie")
    @PreAuthorize("hasPermission('PRODUIT', 'UPDATE')")
    @Operation(summary = "Enregistrer une sortie de stock (déduction de quantité)")
    public ResponseEntity<StockDTO> sortie(
            @PathVariable("id") Long id,
            @RequestParam(name = "quantite") @Min(1) int quantite) {
        return ResponseEntity.ok(stockService.sortie(id, quantite));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('PRODUIT', 'DELETE')")
    @Operation(summary = "Supprimer un stock")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        stockService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
