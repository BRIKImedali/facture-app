package com.pfe.facturation.controller;

import com.pfe.facturation.dto.VendeurDTO;
import com.pfe.facturation.service.VendeurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendeurs")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Tag(name = "Vendeurs", description = "Gestion des vendeurs / commerciaux")
public class VendeurController {

    private final VendeurService vendeurService;

    public VendeurController(VendeurService vendeurService) {
        this.vendeurService = vendeurService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('VENDEUR', 'READ')")
    @Operation(summary = "Lister tous les vendeurs")
    public ResponseEntity<List<VendeurDTO>> findAll() {
        return ResponseEntity.ok(vendeurService.findAll());
    }

    @GetMapping("/actifs")
    @PreAuthorize("hasPermission('VENDEUR', 'READ')")
    @Operation(summary = "Lister les vendeurs actifs")
    public ResponseEntity<List<VendeurDTO>> findActifs() {
        return ResponseEntity.ok(vendeurService.findActifs());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('VENDEUR', 'READ')")
    @Operation(summary = "Récupérer un vendeur par son ID")
    public ResponseEntity<VendeurDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(vendeurService.findById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('VENDEUR', 'READ')")
    @Operation(summary = "Rechercher des vendeurs")
    public ResponseEntity<List<VendeurDTO>> search(@RequestParam(name = "q") String q) {
        return ResponseEntity.ok(vendeurService.search(q));
    }

    @PostMapping
    @PreAuthorize("hasPermission('VENDEUR', 'CREATE')")
    @Operation(summary = "Créer un nouveau vendeur")
    public ResponseEntity<VendeurDTO> create(@Valid @RequestBody VendeurDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vendeurService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('VENDEUR', 'UPDATE')")
    @Operation(summary = "Modifier un vendeur")
    public ResponseEntity<VendeurDTO> update(@PathVariable("id") Long id,
                                             @Valid @RequestBody VendeurDTO dto) {
        return ResponseEntity.ok(vendeurService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('VENDEUR', 'DELETE')")
    @Operation(summary = "Supprimer un vendeur")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        vendeurService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
