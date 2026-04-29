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

import com.pfe.facturation.entity.Unite;
import com.pfe.facturation.repository.UniteRepository;

@Service
@Transactional
public class ProduitService {

    private static final Logger log = LoggerFactory.getLogger(ProduitService.class);

    private final ProduitRepository produitRepository;
    private final UniteRepository uniteRepository;

    public ProduitService(ProduitRepository produitRepository, UniteRepository uniteRepository) {
        this.produitRepository = produitRepository;
        this.uniteRepository = uniteRepository;
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
        Unite uniteObj = null;
        if (dto.uniteId() != null) {
            uniteObj = uniteRepository.findById(dto.uniteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée : " + dto.uniteId()));
        }

        Produit produit = Produit.builder()
                .reference(dto.reference())
                .nom(dto.nom())
                .description(dto.description())
                .prixHT(dto.prixHT())
                .tauxTva(dto.tauxTva() != null ? dto.tauxTva() : 20.0)
                .unite(uniteObj)
                .actif(dto.actif() != null ? dto.actif() : true)
                .stockQuantite(dto.stockQuantite() != null ? dto.stockQuantite() : 0)
                .stockMinimum(dto.stockMinimum() != null ? dto.stockMinimum() : 0)
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
        if (dto.uniteId() != null) {
            Unite uniteObj = uniteRepository.findById(dto.uniteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée : " + dto.uniteId()));
            existing.setUnite(uniteObj);
        } else {
            existing.setUnite(null);
        }
        if (dto.actif() != null)   existing.setActif(dto.actif());
        if (dto.stockQuantite() != null) existing.setStockQuantite(dto.stockQuantite());
        if (dto.stockMinimum() != null)  existing.setStockMinimum(dto.stockMinimum());

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
                p.getUnite() != null ? p.getUnite().getId() : null,
                p.getUnite() != null ? p.getUnite().getNom() : null,
                p.getActif(),
                p.getStockQuantite(),
                p.getStockMinimum()
        );
    }

    public Produit getOrThrow(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable avec l'id : " + id));
    }
}
