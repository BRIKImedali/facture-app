package com.pfe.facturation.controller;

import com.pfe.facturation.dto.CommandeDTO;
import com.pfe.facturation.dto.CreateCommandeRequest;
import com.pfe.facturation.dto.UpdateStatutCommandeRequest;
import com.pfe.facturation.entity.StatutCommande;
import com.pfe.facturation.service.CommandeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commandes")
@Tag(name = "Commandes", description = "Gestion des commandes")
public class CommandeController {

    private final CommandeService commandeService;

    public CommandeController(CommandeService commandeService) {
        this.commandeService = commandeService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('COMMANDE', 'READ')")
    @Operation(summary = "Lister toutes les commandes")
    public ResponseEntity<List<CommandeDTO>> findAll(
            @RequestParam(name = "statut", required = false) String statut) {
        if (statut != null) {
            return ResponseEntity.ok(commandeService.findByStatut(StatutCommande.valueOf(statut.toUpperCase())));
        }
        return ResponseEntity.ok(commandeService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('COMMANDE', 'READ')")
    @Operation(summary = "Récupérer une commande par son ID")
    public ResponseEntity<CommandeDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(commandeService.findById(id));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasPermission('COMMANDE', 'READ')")
    @Operation(summary = "Lister les commandes d'un client")
    public ResponseEntity<List<CommandeDTO>> findByClient(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(commandeService.findByClient(clientId));
    }

    @PostMapping
    @PreAuthorize("hasPermission('COMMANDE', 'CREATE')")
    @Operation(summary = "Créer une nouvelle commande")
    public ResponseEntity<CommandeDTO> create(
            @Valid @RequestBody CreateCommandeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commandeService.create(request));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasPermission('COMMANDE', 'UPDATE')")
    @Operation(summary = "Changer le statut d'une commande")
    public ResponseEntity<CommandeDTO> updateStatut(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateStatutCommandeRequest request) {
        return ResponseEntity.ok(commandeService.updateStatut(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('COMMANDE', 'DELETE')")
    @Operation(summary = "Supprimer une commande")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        commandeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
