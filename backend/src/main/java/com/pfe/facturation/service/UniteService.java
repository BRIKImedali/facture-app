package com.pfe.facturation.service;

import com.pfe.facturation.aspect.Auditable;
import com.pfe.facturation.dto.UniteDTO;
import com.pfe.facturation.entity.Unite;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.UniteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UniteService {

    private final UniteRepository uniteRepository;

    @Transactional(readOnly = true)
    public List<UniteDTO> getAllUnites() {
        return uniteRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UniteDTO getUniteById(Long id) {
        Unite unite = uniteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée : " + id));
        return mapToDTO(unite);
    }

    @Transactional(readOnly = true)
    public List<UniteDTO> searchUnites(String query) {
        return uniteRepository.searchByNom(query).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Auditable(action = "CREATE", entity = "Unite", description = "Création d'une unité")
    @Transactional
    public UniteDTO createUnite(UniteDTO dto) {
        if (uniteRepository.existsByNom(dto.getNom())) {
            throw new RuntimeException("Une unité avec ce nom existe déjà");
        }
        Unite unite = new Unite();
        unite.setNom(dto.getNom());
        unite.setDescription(dto.getDescription());
        return mapToDTO(uniteRepository.save(unite));
    }

    @Auditable(action = "UPDATE", entity = "Unite", description = "Modification d'une unité")
    @Transactional
    public UniteDTO updateUnite(Long id, UniteDTO dto) {
        Unite unite = uniteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée : " + id));
        
        if (!unite.getNom().equals(dto.getNom()) && uniteRepository.existsByNom(dto.getNom())) {
            throw new RuntimeException("Une unité avec ce nom existe déjà");
        }
        
        unite.setNom(dto.getNom());
        unite.setDescription(dto.getDescription());
        return mapToDTO(uniteRepository.save(unite));
    }

    @Auditable(action = "DELETE", entity = "Unite", description = "Suppression d'une unité")
    @Transactional
    public void deleteUnite(Long id) {
        Unite unite = uniteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée : " + id));
        uniteRepository.delete(unite);
    }

    private UniteDTO mapToDTO(Unite unite) {
        UniteDTO dto = new UniteDTO();
        dto.setId(unite.getId());
        dto.setNom(unite.getNom());
        dto.setDescription(unite.getDescription());
        return dto;
    }
}
