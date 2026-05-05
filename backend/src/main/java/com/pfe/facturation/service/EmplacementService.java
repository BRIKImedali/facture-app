package com.pfe.facturation.service;

import com.pfe.facturation.dto.EmplacementDTO;
import com.pfe.facturation.entity.Emplacement;
import com.pfe.facturation.entity.Site;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.EmplacementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmplacementService {

    private static final Logger log = LoggerFactory.getLogger(EmplacementService.class);

    private final EmplacementRepository emplacementRepository;
    private final SiteService siteService;

    public EmplacementService(EmplacementRepository emplacementRepository,
                              SiteService siteService) {
        this.emplacementRepository = emplacementRepository;
        this.siteService = siteService;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<EmplacementDTO> findAll() {
        return emplacementRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmplacementDTO> findBySite(Long siteId) {
        return emplacementRepository.findBySiteId(siteId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmplacementDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<EmplacementDTO> search(String query) {
        return emplacementRepository.search(query).stream()
                .map(this::toDTO)
                .toList();
    }

    // ===== Écriture =====

    public EmplacementDTO create(EmplacementDTO dto) {
        Site site = siteService.getOrThrow(dto.siteId());

        Emplacement emplacement = Emplacement.builder()
                .zone(dto.zone())
                .rayon(dto.rayon())
                .etagere(dto.etagere())
                .site(site)
                .build();

        Emplacement saved = emplacementRepository.save(emplacement);
        log.info("Emplacement créé : id={}, zone={}, site={}", saved.getId(), saved.getZone(), site.getNom());
        return toDTO(saved);
    }

    public EmplacementDTO update(Long id, EmplacementDTO dto) {
        Emplacement existing = getOrThrow(id);
        Site site = siteService.getOrThrow(dto.siteId());

        existing.setZone(dto.zone());
        existing.setRayon(dto.rayon());
        existing.setEtagere(dto.etagere());
        existing.setSite(site);

        Emplacement saved = emplacementRepository.save(existing);
        log.info("Emplacement mis à jour : id={}", id);
        return toDTO(saved);
    }

    public void delete(Long id) {
        if (!emplacementRepository.existsById(id)) {
            throw new ResourceNotFoundException("Emplacement introuvable avec l'id : " + id);
        }
        emplacementRepository.deleteById(id);
        log.info("Emplacement supprimé : id={}", id);
    }

    // ===== Mapper =====

    public EmplacementDTO toDTO(Emplacement e) {
        return new EmplacementDTO(
                e.getId(),
                e.getZone(),
                e.getRayon(),
                e.getEtagere(),
                e.getSite().getId(),
                e.getSite().getNom(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public Emplacement getOrThrow(Long id) {
        return emplacementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emplacement introuvable avec l'id : " + id));
    }
}
