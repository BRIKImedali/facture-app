package com.pfe.facturation.service;

import com.pfe.facturation.dto.DeviseDTO;
import com.pfe.facturation.entity.Devise;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.repository.DeviseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DeviseService {

    private static final Logger log = LoggerFactory.getLogger(DeviseService.class);

    private final DeviseRepository deviseRepository;
    private final ClientRepository clientRepository;

    public DeviseService(DeviseRepository deviseRepository, ClientRepository clientRepository) {
        this.deviseRepository = deviseRepository;
        this.clientRepository = clientRepository;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<DeviseDTO> getAll() {
        return deviseRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DeviseDTO getById(Long id) {
        return toDTO(getOrThrow(id));
    }

    // ===== Écriture =====

    public DeviseDTO create(DeviseDTO dto) {
        if (deviseRepository.existsByCode(dto.code().toUpperCase())) {
            throw new IllegalStateException("Une devise avec le code '" + dto.code() + "' existe déjà.");
        }
        Devise devise = Devise.builder()
                .code(dto.code().toUpperCase())
                .symbole(dto.symbole())
                .nom(dto.nom())
                .actif(dto.actif() != null ? dto.actif() : true)
                .build();
        Devise saved = deviseRepository.save(devise);
        log.info("Devise créée : id={}, code={}", saved.getId(), saved.getCode());
        return toDTO(saved);
    }

    public DeviseDTO update(Long id, DeviseDTO dto) {
        Devise existing = getOrThrow(id);

        // Vérifier unicité du code si changement
        if (!existing.getCode().equalsIgnoreCase(dto.code())
                && deviseRepository.existsByCode(dto.code().toUpperCase())) {
            throw new IllegalStateException("Le code '" + dto.code() + "' est déjà utilisé par une autre devise.");
        }

        existing.setCode(dto.code().toUpperCase());
        existing.setSymbole(dto.symbole());
        existing.setNom(dto.nom());
        existing.setActif(dto.actif() != null ? dto.actif() : true);

        Devise saved = deviseRepository.save(existing);
        log.info("Devise mise à jour : id={}", id);
        return toDTO(saved);
    }

    public void delete(Long id) {
        Devise devise = getOrThrow(id);

        // Règle métier : impossible de supprimer si des clients utilisent cette devise
        boolean usedByClient = clientRepository.existsByDeviseId(id);
        if (usedByClient) {
            throw new IllegalStateException(
                "Impossible de supprimer la devise '" + devise.getCode() +
                "' car elle est utilisée par un ou plusieurs clients."
            );
        }

        deviseRepository.delete(devise);
        log.info("Devise supprimée : id={}", id);
    }

    // ===== Mapper =====

    public DeviseDTO toDTO(Devise d) {
        return new DeviseDTO(
                d.getId(),
                d.getCode(),
                d.getSymbole(),
                d.getNom(),
                d.getActif(),
                d.getCreatedAt()
        );
    }

    private Devise getOrThrow(Long id) {
        return deviseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devise introuvable avec l'id : " + id));
    }
}
