package com.pfe.facturation.controller;

import com.pfe.facturation.dto.DeviseDTO;
import com.pfe.facturation.service.DeviseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devises")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Tag(name = "Devises", description = "Gestion des devises monétaires")
public class DeviseController {

    private final DeviseService deviseService;

    public DeviseController(DeviseService deviseService) {
        this.deviseService = deviseService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('DEVISE', 'READ')")
    @Operation(summary = "Lister toutes les devises")
    public ResponseEntity<List<DeviseDTO>> getAll() {
        return ResponseEntity.ok(deviseService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('DEVISE', 'READ')")
    @Operation(summary = "Récupérer une devise par son ID")
    public ResponseEntity<DeviseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(deviseService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasPermission('DEVISE', 'CREATE')")
    @Operation(summary = "Créer une nouvelle devise")
    public ResponseEntity<DeviseDTO> create(@Valid @RequestBody DeviseDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviseService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('DEVISE', 'UPDATE')")
    @Operation(summary = "Modifier une devise")
    public ResponseEntity<DeviseDTO> update(@PathVariable Long id,
                                            @Valid @RequestBody DeviseDTO dto) {
        return ResponseEntity.ok(deviseService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('DEVISE', 'DELETE')")
    @Operation(summary = "Supprimer une devise")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deviseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
