package com.pfe.facturation.service;

import com.pfe.facturation.dto.VendeurDTO;
import com.pfe.facturation.entity.Vendeur;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.repository.VendeurRepository;
import com.pfe.facturation.security.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VendeurService {

    private static final Logger log = LoggerFactory.getLogger(VendeurService.class);

    private final VendeurRepository vendeurRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    public VendeurService(VendeurRepository vendeurRepository, UserRepository userRepository,
                          ClientRepository clientRepository) {
        this.vendeurRepository = vendeurRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<VendeurDTO> findAll() {
        return vendeurRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VendeurDTO> findActifs() {
        return vendeurRepository.findByActifTrue().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public VendeurDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<VendeurDTO> search(String query) {
        return vendeurRepository.search(query).stream()
                .map(this::toDTO)
                .toList();
    }

    // ===== Écriture =====

    public VendeurDTO create(VendeurDTO dto) {
        if (dto.email() != null && !dto.email().isBlank()
                && vendeurRepository.existsByEmail(dto.email())) {
            throw new IllegalStateException("Un vendeur avec l'email '" + dto.email() + "' existe déjà.");
        }
        if (dto.matriculeInterne() != null && !dto.matriculeInterne().isBlank()
                && vendeurRepository.existsByMatriculeInterne(dto.matriculeInterne())) {
            throw new IllegalStateException("Un vendeur avec le matricule '" + dto.matriculeInterne() + "' existe déjà.");
        }

        Vendeur vendeur = toEntity(dto);
        Vendeur saved = vendeurRepository.save(vendeur);
        log.info("Vendeur créé : id={}, nom={} {}", saved.getId(), saved.getNom(), saved.getPrenom());
        return toDTO(saved);
    }

    public VendeurDTO update(Long id, VendeurDTO dto) {
        Vendeur existing = getOrThrow(id);

        if (dto.email() != null && !dto.email().equals(existing.getEmail())
                && vendeurRepository.existsByEmail(dto.email())) {
            throw new IllegalStateException("L'email '" + dto.email() + "' est déjà utilisé par un autre vendeur.");
        }
        if (dto.matriculeInterne() != null && !dto.matriculeInterne().equals(existing.getMatriculeInterne())
                && vendeurRepository.existsByMatriculeInterne(dto.matriculeInterne())) {
            throw new IllegalStateException("Le matricule '" + dto.matriculeInterne() + "' est déjà utilisé.");
        }

        existing.setNom(dto.nom());
        existing.setPrenom(dto.prenom());
        existing.setEmail(dto.email());
        existing.setTelephone(dto.telephone());
        existing.setAdresse(dto.adresse());
        existing.setVille(dto.ville());
        existing.setPays(dto.pays() != null ? dto.pays() : "Maroc");
        existing.setCin(dto.cin());
        existing.setMatriculeInterne(dto.matriculeInterne());
        existing.setTauxCommission(dto.tauxCommission() != null ? dto.tauxCommission() : 0.0);
        existing.setActif(dto.actif() != null ? dto.actif() : true);
        
        if (dto.userId() != null) {
            existing.setUser(userRepository.findById(dto.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable")));
        } else {
            existing.setUser(null);
        }

        Vendeur saved = vendeurRepository.save(existing);
        log.info("Vendeur mis à jour : id={}", id);
        return toDTO(saved);
    }

    public void delete(Long id) {
        Vendeur vendeur = getOrThrow(id);

        // Règle métier : impossible de supprimer si des clients sont associés
        if (clientRepository.existsByVendeurId(id)) {
            throw new IllegalStateException(
                "Impossible de supprimer le vendeur '" + vendeur.getPrenom() + " " + vendeur.getNom() +
                "' car des clients lui sont associés."
            );
        }

        vendeurRepository.deleteById(id);
        log.info("Vendeur supprimé : id={}", id);
    }

    // ===== Mappers entité ↔ DTO =====

    public VendeurDTO toDTO(Vendeur v) {
        return new VendeurDTO(
                v.getId(),
                v.getNom(),
                v.getPrenom(),
                v.getEmail(),
                v.getTelephone(),
                v.getAdresse(),
                v.getVille(),
                v.getPays(),
                v.getCin(),
                v.getMatriculeInterne(),
                v.getUser() != null ? v.getUser().getId() : null,
                v.getTauxCommission(),
                v.getActif()
        );
    }

    private Vendeur toEntity(VendeurDTO dto) {
        Vendeur v = Vendeur.builder()
                .nom(dto.nom())
                .prenom(dto.prenom())
                .email(dto.email())
                .telephone(dto.telephone())
                .adresse(dto.adresse())
                .ville(dto.ville())
                .pays(dto.pays() != null ? dto.pays() : "Maroc")
                .cin(dto.cin())
                .matriculeInterne(dto.matriculeInterne())
                .tauxCommission(dto.tauxCommission() != null ? dto.tauxCommission() : 0.0)
                .actif(dto.actif() != null ? dto.actif() : true)
                .build();
                
        if (dto.userId() != null) {
            v.setUser(userRepository.findById(dto.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable")));
        }
        return v;
    }

    private Vendeur getOrThrow(Long id) {
        return vendeurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur introuvable avec l'id : " + id));
    }
}
