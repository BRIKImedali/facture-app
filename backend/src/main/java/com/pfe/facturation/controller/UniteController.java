package com.pfe.facturation.controller;

import com.pfe.facturation.dto.UniteDTO;
import com.pfe.facturation.service.UniteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unites")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UniteController {

    private final UniteService uniteService;

    @GetMapping
    @PreAuthorize("hasPermission('UNITE', 'READ')")
    public ResponseEntity<List<UniteDTO>> getAllUnites() {
        return ResponseEntity.ok(uniteService.getAllUnites());
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('UNITE', 'READ')")
    public ResponseEntity<List<UniteDTO>> searchUnites(@RequestParam String q) {
        return ResponseEntity.ok(uniteService.searchUnites(q));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('UNITE', 'READ')")
    public ResponseEntity<UniteDTO> getUniteById(@PathVariable Long id) {
        return ResponseEntity.ok(uniteService.getUniteById(id));
    }

    @PostMapping
    @PreAuthorize("hasPermission('UNITE', 'UPDATE')")
    public ResponseEntity<UniteDTO> createUnite(@RequestBody UniteDTO dto) {
        return ResponseEntity.ok(uniteService.createUnite(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('UNITE', 'UPDATE')")
    public ResponseEntity<UniteDTO> updateUnite(@PathVariable Long id, @RequestBody UniteDTO dto) {
        return ResponseEntity.ok(uniteService.updateUnite(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('UNITE', 'UPDATE')")
    public ResponseEntity<Void> deleteUnite(@PathVariable Long id) {
        uniteService.deleteUnite(id);
        return ResponseEntity.noContent().build();
    }
}
