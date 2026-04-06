package com.pfe.facturation.service;

import com.pfe.facturation.dto.ProduitDTO;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.ProduitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProduitService {

    private static final Logger log = LoggerFactory.getLogger(ProduitService.class);

    private final ProduitRepository produitRepository;

    public ProduitService(ProduitRepository produitRepository) {
        this.produitRepository = produitRepository;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<ProduitDTO> findAll() {
        return produitRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProduitDTO> findActifs() {
        return produitRepository.findByActifTrue().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProduitDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ProduitDTO> search(String query) {
        return produitRepository.search(query).stream()
                .map(this::toDTO)
                .toList();
    }

    // ===== Écriture =====

    public ProduitDTO create(ProduitDTO dto) {
        Produit produit = Produit.builder()
                .reference(dto.reference())
                .nom(dto.nom())
                .description(dto.description())
                .prixHT(dto.prixHT())
                .tauxTva(dto.tauxTva() != null ? dto.tauxTva() : 20.0)
                .unite(dto.unite() != null ? dto.unite() : "unité")
                .actif(dto.actif() != null ? dto.actif() : true)
                .build();

        Produit saved = produitRepository.save(produit);
        log.info("Produit créé : id={}, nom={}", saved.getId(), saved.getNom());
        return toDTO(saved);
    }

    public ProduitDTO update(Long id, ProduitDTO dto) {
        Produit existing = getOrThrow(id);

        existing.setReference(dto.reference());
        existing.setNom(dto.nom());
        existing.setDescription(dto.description());
        existing.setPrixHT(dto.prixHT());
        if (dto.tauxTva() != null) existing.setTauxTva(dto.tauxTva());
        if (dto.unite() != null)   existing.setUnite(dto.unite());
        if (dto.actif() != null)   existing.setActif(dto.actif());

        Produit saved = produitRepository.save(existing);
        log.info("Produit mis à jour : id={}", id);
        return toDTO(saved);
    }

    /** Désactivation logique (soft delete) — ne supprime pas en base */
    public ProduitDTO desactiver(Long id) {
        Produit produit = getOrThrow(id);
        produit.setActif(false);
        return toDTO(produitRepository.save(produit));
    }

    public void delete(Long id) {
        if (!produitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Produit introuvable avec l'id : " + id);
        }
        produitRepository.deleteById(id);
        log.info("Produit supprimé : id={}", id);
    }

    // ===== Mapper =====

    public ProduitDTO toDTO(Produit p) {
        return new ProduitDTO(
                p.getId(),
                p.getReference(),
                p.getNom(),
                p.getDescription(),
                p.getPrixHT(),
                p.getTauxTva(),
                p.getUnite(),
                p.getActif()
        );
    }

    public Produit getOrThrow(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable avec l'id : " + id));
    }
}
