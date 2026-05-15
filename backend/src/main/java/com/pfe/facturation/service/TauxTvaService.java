package com.pfe.facturation.service;

import com.pfe.facturation.dto.TauxTvaDTO;
import com.pfe.facturation.entity.TauxTva;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.CommandeRepository;
import com.pfe.facturation.repository.DevisRepository;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.repository.TauxTvaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service de gestion des taux de TVA.
 *
 * Règles métier :
 *  - Impossible de supprimer un taux utilisé dans une facture/devis/commande existante
 *  - Impossible de désactiver le dernier taux actif
 *  - Les taux désactivés n'apparaissent plus dans les formulaires (endpoint /actifs)
 *    mais restent visibles dans les documents existants
 */
@Service
@Transactional
public class TauxTvaService {

    private static final Logger log = LoggerFactory.getLogger(TauxTvaService.class);

    private final TauxTvaRepository tauxTvaRepository;
    private final FactureRepository factureRepository;
    private final DevisRepository   devisRepository;
    private final CommandeRepository commandeRepository;

    public TauxTvaService(TauxTvaRepository tauxTvaRepository,
                          FactureRepository factureRepository,
                          DevisRepository devisRepository,
                          CommandeRepository commandeRepository) {
        this.tauxTvaRepository   = tauxTvaRepository;
        this.factureRepository   = factureRepository;
        this.devisRepository     = devisRepository;
        this.commandeRepository  = commandeRepository;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<TauxTvaDTO> getAll() {
        return tauxTvaRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TauxTvaDTO> getAllActifs() {
        return tauxTvaRepository.findByActifTrueOrderByValeurAsc().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TauxTvaDTO getById(Long id) {
        return toDTO(getOrThrow(id));
    }

    // ===== Écriture =====

    public TauxTvaDTO create(TauxTvaDTO dto) {
        if (dto.valeur() == null) {
            throw new IllegalArgumentException("La valeur du taux TVA est obligatoire.");
        }
        if (tauxTvaRepository.existsByValeur(dto.valeur())) {
            throw new IllegalStateException(
                "Un taux TVA de " + dto.valeur() + "% existe déjà."
            );
        }

        TauxTva taux = TauxTva.builder()
                .valeur(dto.valeur())
                .description(dto.description())
                .actif(dto.actif() != null ? dto.actif() : true)
                .build();

        TauxTva saved = tauxTvaRepository.save(taux);
        log.info("Taux TVA créé : id={}, valeur={}%", saved.getId(), saved.getValeur());
        return toDTO(saved);
    }

    public TauxTvaDTO update(Long id, TauxTvaDTO dto) {
        TauxTva existing = getOrThrow(id);

        // Règle métier : interdire la désactivation du dernier taux actif
        if (Boolean.TRUE.equals(existing.getActif())
                && Boolean.FALSE.equals(dto.actif())
                && tauxTvaRepository.countByActifTrue() <= 1) {
            throw new IllegalStateException(
                "Impossible de désactiver le dernier taux TVA actif."
            );
        }

        // Vérifier l'unicité de la valeur si elle change
        if (!existing.getValeur().equals(dto.valeur())
                && tauxTvaRepository.existsByValeur(dto.valeur())) {
            throw new IllegalStateException(
                "Un taux TVA de " + dto.valeur() + "% existe déjà."
            );
        }

        existing.setValeur(dto.valeur());
        existing.setDescription(dto.description());
        existing.setActif(dto.actif() != null ? dto.actif() : existing.getActif());

        TauxTva saved = tauxTvaRepository.save(existing);
        log.info("Taux TVA mis à jour : id={}", id);
        return toDTO(saved);
    }

    public void delete(Long id) {
        TauxTva taux = getOrThrow(id);

        // Règle métier : vérifier si ce taux est utilisé dans des lignes de facturation.
        // On compare via Double.compare pour éviter les problèmes de précision float.
        Double valeur = taux.getValeur();

        boolean usedInFacture = factureRepository.findAll().stream()
                .flatMap(f -> f.getLignes().stream())
                .anyMatch(l -> l.getTauxTva() != null
                        && Double.compare(l.getTauxTva(), valeur) == 0);

        boolean usedInDevis = devisRepository.findAll().stream()
                .flatMap(d -> d.getLignes().stream())
                .anyMatch(l -> l.getTauxTva() != null
                        && Double.compare(l.getTauxTva(), valeur) == 0);

        boolean usedInCommande = commandeRepository.findAll().stream()
                .flatMap(c -> c.getLignes().stream())
                .anyMatch(l -> l.getTauxTva() != null
                        && Double.compare(l.getTauxTva(), valeur) == 0);

        if (usedInFacture || usedInDevis || usedInCommande) {
            throw new IllegalStateException(
                "Impossible de supprimer le taux TVA " + valeur +
                "% car il est utilisé dans des documents existants."
            );
        }

        tauxTvaRepository.delete(taux);
        log.info("Taux TVA supprimé : id={}, valeur={}%", id, valeur);
    }

    /**
     * Initialise les 4 taux TVA par défaut au démarrage.
     * Appelé depuis AdminDataInitializer si les données n'existent pas.
     */
    public void initDefaultTaux() {
        Object[][] defauts = {
            { 0.0,  "Exonéré" },
            { 7.0,  "Taux réduit" },
            { 13.0, "Intermédiaire" },
            { 19.0, "Normal" },
        };
        for (Object[] d : defauts) {
            Double valeur = (Double) d[0];
            if (!tauxTvaRepository.existsByValeur(valeur)) {
                tauxTvaRepository.save(TauxTva.builder()
                        .valeur(valeur)
                        .description((String) d[1])
                        .actif(true)
                        .build());
                log.info("Taux TVA par défaut créé : {}% — {}", valeur, d[1]);
            }
        }
    }

    // ===== Mapper =====

    private TauxTvaDTO toDTO(TauxTva t) {
        return new TauxTvaDTO(
                t.getId(),
                t.getValeur(),
                t.getDescription(),
                t.getActif(),
                t.getCreatedAt()
        );
    }

    private TauxTva getOrThrow(Long id) {
        return tauxTvaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Taux TVA introuvable avec l'id : " + id));
    }
}
