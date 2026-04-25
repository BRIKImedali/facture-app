package com.pfe.facturation.controller;

import com.pfe.facturation.dto.CategorieClientDTO;
import com.pfe.facturation.service.CategorieClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories-clients")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class CategorieClientController {

    private final CategorieClientService categorieClientService;

    @GetMapping
    @PreAuthorize("hasPermission('CATEGORIE', 'READ')")
    public ResponseEntity<List<CategorieClientDTO>> getAllCategories() {
        return ResponseEntity.ok(categorieClientService.getAllCategories());
    }

    @GetMapping("/search")
    @PreAuthorize("hasPermission('CATEGORIE', 'READ')")
    public ResponseEntity<List<CategorieClientDTO>> searchCategories(@RequestParam String q) {
        return ResponseEntity.ok(categorieClientService.searchCategories(q));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('CATEGORIE', 'READ')")
    public ResponseEntity<CategorieClientDTO> getCategorieById(@PathVariable Long id) {
        return ResponseEntity.ok(categorieClientService.getCategorieById(id));
    }

    @PostMapping
    @PreAuthorize("hasPermission('CATEGORIE', 'UPDATE')")
    public ResponseEntity<CategorieClientDTO> createCategorie(@RequestBody CategorieClientDTO dto) {
        return ResponseEntity.ok(categorieClientService.createCategorie(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('CATEGORIE', 'UPDATE')")
    public ResponseEntity<CategorieClientDTO> updateCategorie(@PathVariable Long id, @RequestBody CategorieClientDTO dto) {
        return ResponseEntity.ok(categorieClientService.updateCategorie(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('CATEGORIE', 'UPDATE')")
    public ResponseEntity<Void> deleteCategorie(@PathVariable Long id) {
        categorieClientService.deleteCategorie(id);
        return ResponseEntity.noContent().build();
    }
}
