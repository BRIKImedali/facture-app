package com.pfe.facturation.service;

import com.pfe.facturation.dto.*;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.security.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class DevisService {

    private static final Logger log = LoggerFactory.getLogger(DevisService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DevisRepository devisRepository;
    private final ClientRepository clientRepository;
    private final ProduitRepository produitRepository;
    private final ClientService clientService;
    private final CommandeService commandeService;

    public DevisService(DevisRepository devisRepository,
                        ClientRepository clientRepository,
                        ProduitRepository produitRepository,
                        ClientService clientService,
                        @Lazy CommandeService commandeService) {
        this.devisRepository = devisRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
        this.clientService = clientService;
        this.commandeService = commandeService;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<DevisDTO> findAll() {
        return devisRepository.findAllByOrderByDateDevisDesc()
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public DevisDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<DevisDTO> findByClient(Long clientId) {
        return devisRepository.findByClientIdOrderByDateDevisDesc(clientId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<DevisDTO> findByStatut(StatutDevis statut) {
        return devisRepository.findByStatutOrderByDateDevisDesc(statut)
                .stream().map(this::toDTO).toList();
    }

    // ===== Création =====

    public DevisDTO create(CreateDevisRequest request, User creator) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + request.clientId()));

        String reference = generateReference();

        List<LigneDevis> lignes = request.lignes().stream()
                .map(this::buildLignefromCreate)
                .toList();

        BigDecimal totalHT = lignes.stream()
                .map(LigneDevis::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remise = request.remise() != null ? request.remise() : BigDecimal.ZERO;
        BigDecimal totalHTApresRemise = appliquerRemise(totalHT, remise);

        // TVA recalculée proportionnellement sur le HT après remise
        BigDecimal ratioRemise = totalHT.compareTo(BigDecimal.ZERO) > 0
                ? totalHTApresRemise.divide(totalHT, 10, RoundingMode.HALF_UP)
                : BigDecimal.ONE;

        BigDecimal totalTva = lignes.stream()
                .map(LigneDevis::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(ratioRemise)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalTTC = totalHTApresRemise.add(totalTva);

        Devis devis = Devis.builder()
                .reference(reference)
                .client(client)
                .createdBy(creator)
                .statut(StatutDevis.BROUILLON)
                .dateExpiration(request.dateExpiration())
                .notes(request.notes())
                .remise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null)
                .totalHT(totalHT.setScale(2, RoundingMode.HALF_UP))
                .totalHT_apres_remise(totalHTApresRemise.setScale(2, RoundingMode.HALF_UP))
                .totalTva(totalTva)
                .totalTTC(totalTTC.setScale(2, RoundingMode.HALF_UP))
                .build();

        Devis saved = devisRepository.save(devis);

        lignes.forEach(l -> l.setDevis(saved));
        saved.getLignes().addAll(lignes);
        Devis withLignes = devisRepository.save(saved);

        log.info("Devis créé : {} pour le client {}", reference, client.getNom());
        return toDTO(withLignes);
    }

    // ===== Mise à jour complète (PUT) =====

    public DevisDTO update(Long id, UpdateDevisRequest request) {
        Devis devis = getOrThrow(id);

        if (devis.getStatut() != StatutDevis.BROUILLON && devis.getStatut() != StatutDevis.ENVOYE) {
            throw new IllegalStateException(
                    "Modification impossible : le devis est en statut " + devis.getStatut() +
                    ". Seuls les devis BROUILLON ou ENVOYE sont modifiables.");
        }

        // Reconstruire les lignes
        List<LigneDevis> nouvellesLignes = request.lignes().stream()
                .map(this::buildLigneFromUpdate)
                .toList();

        BigDecimal totalHT = nouvellesLignes.stream()
                .map(LigneDevis::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remise = request.remise() != null ? request.remise() : BigDecimal.ZERO;
        BigDecimal totalHTApresRemise = appliquerRemise(totalHT, remise);

        BigDecimal ratioRemise = totalHT.compareTo(BigDecimal.ZERO) > 0
                ? totalHTApresRemise.divide(totalHT, 10, RoundingMode.HALF_UP)
                : BigDecimal.ONE;

        BigDecimal totalTva = nouvellesLignes.stream()
                .map(LigneDevis::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(ratioRemise)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalTTC = totalHTApresRemise.add(totalTva);

        // Mettre à jour les champs
        devis.setDateExpiration(request.dateExpiration());
        devis.setNotes(request.notes());
        devis.setRemise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null);
        devis.setTotalHT(totalHT.setScale(2, RoundingMode.HALF_UP));
        devis.setTotalHT_apres_remise(totalHTApresRemise.setScale(2, RoundingMode.HALF_UP));
        devis.setTotalTva(totalTva);
        devis.setTotalTTC(totalTTC.setScale(2, RoundingMode.HALF_UP));

        // Remplacer les lignes (orphanRemoval = true → les anciennes sont supprimées)
        devis.getLignes().clear();
        nouvellesLignes.forEach(l -> l.setDevis(devis));
        devis.getLignes().addAll(nouvellesLignes);

        Devis saved = devisRepository.save(devis);
        log.info("Devis {} mis à jour", devis.getReference());
        return toDTO(saved);
    }

    // ===== Changement de statut + déclenchement automatique =====

    public DevisDTO updateStatut(Long id, UpdateStatutDevisRequest request) {
        Devis devis = getOrThrow(id);
        StatutDevis ancienStatut = devis.getStatut();
        StatutDevis nouveauStatut = request.statut();

        validerTransition(ancienStatut, nouveauStatut);

        devis.setStatut(nouveauStatut);
        Devis saved = devisRepository.save(devis);
        log.info("Devis {} : statut changé de {} → {}", devis.getReference(), ancienStatut, nouveauStatut);

        // ── Flux automatique : ACCEPTE → création d'une Commande ──────────────
        if (nouveauStatut == StatutDevis.ACCEPTE) {
            commandeService.creerDepuisDevis(saved);
        }

        return toDTO(saved);
    }

    // ===== Suppression =====

    public void delete(Long id) {
        Devis devis = getOrThrow(id);
        if (devis.getStatut() == StatutDevis.ACCEPTE) {
            throw new IllegalStateException("Impossible de supprimer un devis accepté.");
        }
        devisRepository.deleteById(id);
        log.info("Devis supprimé : id={}", id);
    }

    // ===== Méthodes privées =====

    private synchronized String generateReference() {
        int year = LocalDate.now().getYear();
        long count = devisRepository.countByYear(year);
        return String.format("DEV-%d-%04d", year, count + 1);
    }

    /** Applique une remise en % sur un montant HT. */
    private BigDecimal appliquerRemise(BigDecimal montantHT, BigDecimal remisePct) {
        if (remisePct == null || remisePct.compareTo(BigDecimal.ZERO) == 0) {
            return montantHT;
        }
        BigDecimal facteur = BigDecimal.ONE
                .subtract(remisePct.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
        return montantHT.multiply(facteur).setScale(2, RoundingMode.HALF_UP);
    }

    private LigneDevis buildLignefromCreate(CreateDevisRequest.LigneDevisRequest lr) {
        BigDecimal montantHT = lr.prixUnitaireHT()
                .multiply(new BigDecimal(lr.quantite()))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal montantTva = montantHT
                .multiply(BigDecimal.valueOf(lr.tauxTva()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal montantTTC = montantHT.add(montantTva);

        LigneDevis ligne = LigneDevis.builder()
                .designation(lr.designation())
                .quantite(lr.quantite())
                .prixUnitaireHT(lr.prixUnitaireHT())
                .tauxTva(lr.tauxTva())
                .montantHT(montantHT)
                .montantTva(montantTva)
                .montantTTC(montantTTC)
                .build();

        if (lr.produitId() != null) {
            produitRepository.findById(lr.produitId()).ifPresent(ligne::setProduit);
        }

        return ligne;
    }

    private LigneDevis buildLigneFromUpdate(UpdateDevisRequest.LigneDevisRequest lr) {
        BigDecimal montantHT = lr.prixUnitaireHT()
                .multiply(new BigDecimal(lr.quantite()))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal montantTva = montantHT
                .multiply(BigDecimal.valueOf(lr.tauxTva()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        LigneDevis ligne = LigneDevis.builder()
                .designation(lr.designation())
                .quantite(lr.quantite())
                .prixUnitaireHT(lr.prixUnitaireHT())
                .tauxTva(lr.tauxTva())
                .montantHT(montantHT)
                .montantTva(montantTva)
                .montantTTC(montantHT.add(montantTva))
                .build();

        if (lr.produitId() != null) {
            produitRepository.findById(lr.produitId()).ifPresent(ligne::setProduit);
        }

        return ligne;
    }

    private void validerTransition(StatutDevis ancien, StatutDevis nouveau) {
        boolean valide = switch (ancien) {
            case BROUILLON -> nouveau == StatutDevis.ENVOYE || nouveau == StatutDevis.REFUSE || nouveau == StatutDevis.ACCEPTE;
            case ENVOYE    -> nouveau == StatutDevis.ACCEPTE || nouveau == StatutDevis.REFUSE || nouveau == StatutDevis.EXPIRE;
            case ACCEPTE, REFUSE, EXPIRE -> false;
        };
        if (!valide) {
            throw new IllegalStateException(
                    String.format("Transition invalide : %s → %s", ancien, nouveau));
        }
    }

    public DevisDTO toDTO(Devis d) {
        List<DevisDTO.LigneDevisDTO> lignesDTO = d.getLignes().stream()
                .map(l -> new DevisDTO.LigneDevisDTO(
                        l.getId(),
                        l.getDesignation(),
                        l.getQuantite(),
                        l.getPrixUnitaireHT(),
                        l.getTauxTva(),
                        l.getMontantHT(),
                        l.getMontantTva(),
                        l.getMontantTTC(),
                        l.getProduit() != null ? l.getProduit().getId() : null
                ))
                .toList();

        return new DevisDTO(
                d.getId(),
                d.getReference(),
                d.getStatut() != null ? d.getStatut().name() : null,
                d.getDateDevis() != null ? d.getDateDevis().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null,
                d.getDateExpiration() != null ? d.getDateExpiration().format(DATE_FMT) : null,
                d.getNotes(),
                d.getCreatedBy() != null ? d.getCreatedBy().getUsername() : null,
                d.getClient() != null ? clientService.toDTO(d.getClient()) : null,
                lignesDTO,
                d.getTotalHT(),
                d.getRemise(),
                d.getTotalHT_apres_remise(),
                d.getTotalTva(),
                d.getTotalTTC()
        );
    }

    private Devis getOrThrow(Long id) {
        return devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable avec l'id : " + id));
    }
}
