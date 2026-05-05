package com.pfe.facturation.service;

import com.pfe.facturation.dto.SiteDTO;
import com.pfe.facturation.entity.Site;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.SiteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SiteService {

    private static final Logger log = LoggerFactory.getLogger(SiteService.class);

    private final SiteRepository siteRepository;

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<SiteDTO> findAll() {
        return siteRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SiteDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<SiteDTO> search(String query) {
        return siteRepository.search(query).stream()
                .map(this::toDTO)
                .toList();
    }

    // ===== Écriture =====

    public SiteDTO create(SiteDTO dto) {
        Site site = Site.builder()
                .nom(dto.nom())
                .adresse(dto.adresse())
                .ville(dto.ville())
                .codePostal(dto.codePostal())
                .pays(dto.pays() != null ? dto.pays() : "France")
                .responsable(dto.responsable())
                .telephone(dto.telephone())
                .build();

        Site saved = siteRepository.save(site);
        log.info("Site créé : id={}, nom={}", saved.getId(), saved.getNom());
        return toDTO(saved);
    }

    public SiteDTO update(Long id, SiteDTO dto) {
        Site existing = getOrThrow(id);

        existing.setNom(dto.nom());
        existing.setAdresse(dto.adresse());
        existing.setVille(dto.ville());
        existing.setCodePostal(dto.codePostal());
        if (dto.pays() != null) existing.setPays(dto.pays());
        existing.setResponsable(dto.responsable());
        existing.setTelephone(dto.telephone());

        Site saved = siteRepository.save(existing);
        log.info("Site mis à jour : id={}", id);
        return toDTO(saved);
    }

    public void delete(Long id) {
        if (!siteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Site introuvable avec l'id : " + id);
        }
        siteRepository.deleteById(id);
        log.info("Site supprimé : id={}", id);
    }

    // ===== Mapper =====

    public SiteDTO toDTO(Site s) {
        return new SiteDTO(
                s.getId(),
                s.getNom(),
                s.getAdresse(),
                s.getVille(),
                s.getCodePostal(),
                s.getPays(),
                s.getResponsable(),
                s.getTelephone(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    public Site getOrThrow(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site introuvable avec l'id : " + id));
    }
}
