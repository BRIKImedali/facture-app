package com.pfe.facturation.controller;

import com.pfe.facturation.dto.TauxTvaDTO;
import com.pfe.facturation.service.TauxTvaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taux-tva")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Tag(name = "Taux TVA", description = "Gestion des taux de TVA")
public class TauxTvaController {

    private final TauxTvaService tauxTvaService;

    public TauxTvaController(TauxTvaService tauxTvaService) {
        this.tauxTvaService = tauxTvaService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('TVA', 'READ')")
    @Operation(summary = "Lister tous les taux TVA (actifs et inactifs)")
    public ResponseEntity<List<TauxTvaDTO>> getAll() {
        return ResponseEntity.ok(tauxTvaService.getAll());
    }

    @GetMapping("/actifs")
    @PreAuthorize("hasPermission('TVA', 'READ')")
    @Operation(summary = "Lister uniquement les taux TVA actifs — utilisé dans les formulaires")
    public ResponseEntity<List<TauxTvaDTO>> getAllActifs() {
        return ResponseEntity.ok(tauxTvaService.getAllActifs());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('TVA', 'READ')")
    @Operation(summary = "Récupérer un taux TVA par son ID")
    public ResponseEntity<TauxTvaDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tauxTvaService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasPermission('TVA', 'CREATE')")
    @Operation(summary = "Créer un nouveau taux TVA")
    public ResponseEntity<TauxTvaDTO> create(@Valid @RequestBody TauxTvaDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tauxTvaService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('TVA', 'UPDATE')")
    @Operation(summary = "Modifier un taux TVA existant")
    public ResponseEntity<TauxTvaDTO> update(@PathVariable Long id,
                                             @Valid @RequestBody TauxTvaDTO dto) {
        return ResponseEntity.ok(tauxTvaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('TVA', 'DELETE')")
    @Operation(summary = "Supprimer un taux TVA")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tauxTvaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
