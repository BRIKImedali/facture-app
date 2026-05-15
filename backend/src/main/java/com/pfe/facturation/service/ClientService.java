package com.pfe.facturation.service;

import com.pfe.facturation.dto.ClientDTO;
import com.pfe.facturation.entity.CategorieClient;
import com.pfe.facturation.entity.Client;
import com.pfe.facturation.entity.Devise;
import com.pfe.facturation.entity.Vendeur;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.CategorieClientRepository;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.repository.DeviseRepository;
import com.pfe.facturation.repository.VendeurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClientService {

    private static final Logger log = LoggerFactory.getLogger(ClientService.class);

    private final ClientRepository clientRepository;
    private final CategorieClientRepository categoryRepository;
    private final VendeurRepository vendeurRepository;
    private final DeviseRepository deviseRepository;

    public ClientService(ClientRepository clientRepository,
                         CategorieClientRepository categoryRepository,
                         VendeurRepository vendeurRepository,
                         DeviseRepository deviseRepository) {
        this.clientRepository = clientRepository;
        this.categoryRepository = categoryRepository;
        this.vendeurRepository = vendeurRepository;
        this.deviseRepository = deviseRepository;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<ClientDTO> findAll() {
        return clientRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ClientDTO> search(String query) {
        return clientRepository.search(query).stream()
                .map(this::toDTO)
                .toList();
    }

    // ===== Écriture =====

    public ClientDTO create(ClientDTO dto) {
        // Vérifier unicité de l'email si fourni
        if (dto.email() != null && !dto.email().isBlank()
                && clientRepository.existsByEmail(dto.email())) {
            throw new IllegalStateException("Un client avec l'email '" + dto.email() + "' existe déjà.");
        }

        Client client = toEntity(dto);
        Client saved = clientRepository.save(client);
        log.info("Client créé : id={}, nom={}", saved.getId(), saved.getNom());
        return toDTO(saved);
    }

    public ClientDTO update(Long id, ClientDTO dto) {
        Client existing = getOrThrow(id);

        // Vérifier unicité email si l'email change
        if (dto.email() != null && !dto.email().equals(existing.getEmail())
                && clientRepository.existsByEmail(dto.email())) {
            throw new IllegalStateException("L'email '" + dto.email() + "' est déjà utilisé par un autre client.");
        }

        existing.setNom(dto.nom());
        existing.setEmail(dto.email());
        existing.setTelephone(dto.telephone());
        existing.setAdresse(dto.adresse());
        existing.setVille(dto.ville());
        existing.setCodePostal(dto.codePostal());
        existing.setPays(dto.pays() != null ? dto.pays() : "Maroc");
        existing.setIce(dto.ice());

        if (dto.categorieIds() != null && !dto.categorieIds().isEmpty()) {
            List<CategorieClient> categories = categoryRepository.findAllById(dto.categorieIds());
            existing.setCategories(categories);
        } else {
            existing.setCategories(null);
        }

        // Vendeur (optionnel)
        if (dto.vendeurId() != null) {
            Vendeur vendeur = vendeurRepository.findById(dto.vendeurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendeur introuvable : " + dto.vendeurId()));
            existing.setVendeur(vendeur);
        } else {
            existing.setVendeur(null);
        }

        // Devise (optionnel)
        if (dto.deviseId() != null) {
            Devise devise = deviseRepository.findById(dto.deviseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Devise introuvable : " + dto.deviseId()));
            existing.setDevise(devise);
        } else {
            existing.setDevise(null);
        }

        Client saved = clientRepository.save(existing);
        log.info("Client mis à jour : id={}", id);
        return toDTO(saved);
    }

    public void delete(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client introuvable avec l'id : " + id);
        }
        clientRepository.deleteById(id);
        log.info("Client supprimé : id={}", id);
    }

    // ===== Mappers entité ↔ DTO =====

    public ClientDTO toDTO(Client c) {
        return new ClientDTO(
                c.getId(),
                c.getNom(),
                c.getEmail(),
                c.getTelephone(),
                c.getAdresse(),
                c.getVille(),
                c.getCodePostal(),
                c.getPays(),
                c.getIce(),
                c.getCategories() != null ? c.getCategories().stream().map(CategorieClient::getId).toList() : null,
                // Vendeur
                c.getVendeur() != null ? c.getVendeur().getId() : null,
                c.getVendeur() != null ? (c.getVendeur().getPrenom() + " " + c.getVendeur().getNom()) : null,
                // Devise
                c.getDevise() != null ? c.getDevise().getId() : null,
                c.getDevise() != null ? c.getDevise().getCode() : null,
                c.getDevise() != null ? c.getDevise().getSymbole() : null
        );
    }

    private Client toEntity(ClientDTO dto) {
        Client client = Client.builder()
                .nom(dto.nom())
                .email(dto.email())
                .telephone(dto.telephone())
                .adresse(dto.adresse())
                .ville(dto.ville())
                .codePostal(dto.codePostal())
                .pays(dto.pays() != null ? dto.pays() : "Maroc")
                .ice(dto.ice())
                .build();

        if (dto.categorieIds() != null && !dto.categorieIds().isEmpty()) {
            List<CategorieClient> categories = categoryRepository.findAllById(dto.categorieIds());
            client.setCategories(categories);
        }

        // Vendeur (optionnel)
        if (dto.vendeurId() != null) {
            Vendeur vendeur = vendeurRepository.findById(dto.vendeurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendeur introuvable : " + dto.vendeurId()));
            client.setVendeur(vendeur);
        }

        // Devise (optionnel)
        if (dto.deviseId() != null) {
            Devise devise = deviseRepository.findById(dto.deviseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Devise introuvable : " + dto.deviseId()));
            client.setDevise(devise);
        }

        return client;
    }

    /** Récupère un Client ou lève une 404 */
    private Client getOrThrow(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'id : " + id));
    }
}
