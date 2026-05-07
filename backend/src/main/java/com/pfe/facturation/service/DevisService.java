package com.pfe.facturation.service;

import com.pfe.facturation.dto.*;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.security.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public DevisService(DevisRepository devisRepository,
                        ClientRepository clientRepository,
                        ProduitRepository produitRepository,
                        ClientService clientService) {
        this.devisRepository = devisRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
        this.clientService = clientService;
    }

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

    public DevisDTO create(CreateDevisRequest request, User creator) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + request.clientId()));

        String reference = generateReference();

        List<LigneDevis> lignes = request.lignes().stream()
                .map(this::buildLigne)
                .toList();

        BigDecimal totalHT = lignes.stream()
                .map(LigneDevis::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTva = lignes.stream()
                .map(LigneDevis::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTTC = totalHT.add(totalTva);

        Devis devis = Devis.builder()
                .reference(reference)
                .client(client)
                .createdBy(creator)
                .statut(StatutDevis.BROUILLON)
                .dateExpiration(request.dateExpiration())
                .notes(request.notes())
                .totalHT(totalHT.setScale(2, RoundingMode.HALF_UP))
                .totalTva(totalTva.setScale(2, RoundingMode.HALF_UP))
                .totalTTC(totalTTC.setScale(2, RoundingMode.HALF_UP))
                .build();

        Devis saved = devisRepository.save(devis);

        lignes.forEach(l -> l.setDevis(saved));
        saved.getLignes().addAll(lignes);
        Devis withLignes = devisRepository.save(saved);

        log.info("Devis créé : {} pour le client {}", reference, client.getNom());
        return toDTO(withLignes);
    }

    public DevisDTO updateStatut(Long id, UpdateStatutDevisRequest request) {
        Devis devis = getOrThrow(id);
        StatutDevis ancienStatut = devis.getStatut();
        StatutDevis nouveauStatut = request.statut();

        validerTransition(ancienStatut, nouveauStatut);

        devis.setStatut(nouveauStatut);
        Devis saved = devisRepository.save(devis);
        log.info("Devis {} : statut changé de {} → {}", devis.getReference(), ancienStatut, nouveauStatut);
        return toDTO(saved);
    }

    public void delete(Long id) {
        Devis devis = getOrThrow(id);
        if (devis.getStatut() == StatutDevis.ACCEPTE) {
            throw new IllegalStateException("Impossible de supprimer un devis accepté.");
        }
        devisRepository.deleteById(id);
        log.info("Devis supprimé : id={}", id);
    }

    private synchronized String generateReference() {
        int year = LocalDate.now().getYear();
        long count = devisRepository.countByYear(year);
        return String.format("DEV-%d-%04d", year, count + 1);
    }

    private LigneDevis buildLigne(CreateDevisRequest.LigneDevisRequest lr) {
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
            produitRepository.findById(lr.produitId())
                    .ifPresent(ligne::setProduit);
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
                d.getTotalTva(),
                d.getTotalTTC()
        );
    }

    private Devis getOrThrow(Long id) {
        return devisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable avec l'id : " + id));
    }
}
