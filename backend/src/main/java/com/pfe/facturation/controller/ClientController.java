package com.pfe.facturation.controller;

import com.pfe.facturation.dto.ClientDTO;
import com.pfe.facturation.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@Tag(name = "Clients", description = "Gestion des clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    @PreAuthorize("hasPermission('CLIENT', 'READ')")
    @Operation(summary = "Lister tous les clients")
    public ResponseEntity<List<ClientDTO>> findAll() {
        return ResponseEntity.ok(clientService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('CLIENT', 'READ')")
    @Operation(summary = "Récupérer un client par son ID")
    public ResponseEntity<ClientDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(clientService.findById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('CLIENT', 'READ')")
    @Operation(summary = "Rechercher des clients")
    public ResponseEntity<List<ClientDTO>> search(@RequestParam(name = "q") String q) {
        return ResponseEntity.ok(clientService.search(q));
    }

    @PostMapping
    @PreAuthorize("hasPermission('CLIENT', 'CREATE')")
    @Operation(summary = "Créer un nouveau client")
    public ResponseEntity<ClientDTO> create(@Valid @RequestBody ClientDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('CLIENT', 'UPDATE')")
    @Operation(summary = "Modifier un client")
    public ResponseEntity<ClientDTO> update(@PathVariable("id") Long id,
                                             @Valid @RequestBody ClientDTO dto) {
        return ResponseEntity.ok(clientService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('CLIENT', 'DELETE')")
    @Operation(summary = "Supprimer un client")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
