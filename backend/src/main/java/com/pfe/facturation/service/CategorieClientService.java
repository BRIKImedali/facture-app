package com.pfe.facturation.service;

import com.pfe.facturation.aspect.Auditable;
import com.pfe.facturation.dto.CategorieClientDTO;
import com.pfe.facturation.entity.CategorieClient;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.CategorieClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategorieClientService {

    private final CategorieClientRepository categorieClientRepository;

    @Transactional(readOnly = true)
    public List<CategorieClientDTO> getAllCategories() {
        return categorieClientRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategorieClientDTO getCategorieById(Long id) {
        CategorieClient categorie = categorieClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée : " + id));
        return mapToDTO(categorie);
    }

    @Transactional(readOnly = true)
    public List<CategorieClientDTO> searchCategories(String query) {
        return categorieClientRepository.searchByNom(query).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Auditable(action = "CREATE", entity = "CategorieClient", description = "Création d'une catégorie client")
    @Transactional
    public CategorieClientDTO createCategorie(CategorieClientDTO dto) {
        if (categorieClientRepository.existsByNom(dto.getNom())) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
        }
        CategorieClient categorie = new CategorieClient();
        categorie.setNom(dto.getNom());
        categorie.setDescription(dto.getDescription());
        return mapToDTO(categorieClientRepository.save(categorie));
    }

    @Auditable(action = "UPDATE", entity = "CategorieClient", description = "Modification d'une catégorie client")
    @Transactional
    public CategorieClientDTO updateCategorie(Long id, CategorieClientDTO dto) {
        CategorieClient categorie = categorieClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée : " + id));
        
        if (!categorie.getNom().equals(dto.getNom()) && categorieClientRepository.existsByNom(dto.getNom())) {
            throw new RuntimeException("Une catégorie avec ce nom existe déjà");
        }
        
        categorie.setNom(dto.getNom());
        categorie.setDescription(dto.getDescription());
        return mapToDTO(categorieClientRepository.save(categorie));
    }

    @Auditable(action = "DELETE", entity = "CategorieClient", description = "Suppression d'une catégorie client")
    @Transactional
    public void deleteCategorie(Long id) {
        CategorieClient categorie = categorieClientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie non trouvée : " + id));
        categorieClientRepository.delete(categorie);
    }

    private CategorieClientDTO mapToDTO(CategorieClient categorie) {
        CategorieClientDTO dto = new CategorieClientDTO();
        dto.setId(categorie.getId());
        dto.setNom(categorie.getNom());
        dto.setDescription(categorie.getDescription());
        return dto;
    }
}
