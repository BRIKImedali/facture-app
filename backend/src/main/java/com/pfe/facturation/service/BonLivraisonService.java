package com.pfe.facturation.service;

import com.pfe.facturation.dto.BonLivraisonDTO;
import com.pfe.facturation.dto.CreateBonLivraisonRequest;
import com.pfe.facturation.dto.UpdateStatutBonLivraisonRequest;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.BonLivraisonRepository;
import com.pfe.facturation.repository.CommandeRepository;
import com.pfe.facturation.repository.ProduitRepository;
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
public class BonLivraisonService {

    private static final Logger log = LoggerFactory.getLogger(BonLivraisonService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final BonLivraisonRepository blRepository;
    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final ClientService clientService;

    public BonLivraisonService(BonLivraisonRepository blRepository,
                               CommandeRepository commandeRepository,
                               ProduitRepository produitRepository,
                               ClientService clientService) {
        this.blRepository = blRepository;
        this.commandeRepository = commandeRepository;
        this.produitRepository = produitRepository;
        this.clientService = clientService;
    }

    @Transactional(readOnly = true)
    public List<BonLivraisonDTO> findAll() {
        return blRepository.findAllByOrderByDateCreationDesc().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<BonLivraisonDTO> findByClient(Long clientId) {
        return blRepository.findByClientIdOrderByDateCreationDesc(clientId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<BonLivraisonDTO> findByStatut(StatutBonLivraison statut) {
        return blRepository.findByStatutOrderByDateCreationDesc(statut).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<BonLivraisonDTO> findByCommande(Long commandeId) {
        return blRepository.findByCommandeIdOrderByDateCreationDesc(commandeId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public BonLivraisonDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<BonLivraisonDTO> findFacturables(Long clientId) {
        return blRepository.findFacturablesByClientId(clientId).stream().map(this::toDTO).toList();
    }

    public BonLivraisonDTO create(CreateBonLivraisonRequest request) {
        Commande commande = commandeRepository.findById(request.commandeId())
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable : " + request.commandeId()));

        String numero = generateNumero();

        BonLivraison bl = BonLivraison.builder()
                .numero(numero)
                .commande(commande)
                .client(commande.getClient())
                .statut(StatutBonLivraison.BROUILLON)
                .dateLivraison(request.dateLivraison())
                .notes(request.notes())
                .build();

        BonLivraison saved = blRepository.save(bl);

        List<LigneBonLivraison> lignes = request.lignes().stream()
                .map(lr -> buildLigne(lr, saved))
                .toList();

        BigDecimal totalHT = lignes.stream().map(LigneBonLivraison::getMontantHT).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTva = lignes.stream().map(LigneBonLivraison::getMontantTva).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTTC = totalHT.add(totalTva).setScale(2, RoundingMode.HALF_UP);

        saved.getLignes().addAll(lignes);
        saved.setTotalHT(totalHT.setScale(2, RoundingMode.HALF_UP));
        saved.setTotalTva(totalTva.setScale(2, RoundingMode.HALF_UP));
        saved.setTotalTTC(totalTTC);

        BonLivraison result = blRepository.save(saved);
        log.info("Bon de livraison créé : {} pour commande {}", numero, commande.getReference());
        return toDTO(result);
    }

    public BonLivraisonDTO updateStatut(Long id, UpdateStatutBonLivraisonRequest request) {
        BonLivraison bl = getOrThrow(id);
        StatutBonLivraison ancien = bl.getStatut();
        StatutBonLivraison nouveau = request.statut();

        validerTransition(ancien, nouveau);

        bl.setStatut(nouveau);
        BonLivraison saved = blRepository.save(bl);
        log.info("BL {} : statut {} → {}", bl.getNumero(), ancien, nouveau);
        return toDTO(saved);
    }

    private void validerTransition(StatutBonLivraison ancien, StatutBonLivraison nouveau) {
        boolean valide = switch (ancien) {
            case BROUILLON -> nouveau == StatutBonLivraison.EN_COURS || nouveau == StatutBonLivraison.ANNULE;
            case EN_COURS  -> nouveau == StatutBonLivraison.LIVRE || nouveau == StatutBonLivraison.ANNULE;
            case LIVRE, ANNULE -> false;
        };
        if (!valide) {
            throw new IllegalStateException(
                    String.format("Transition de statut invalide : %s → %s", ancien, nouveau));
        }
    }

    private synchronized String generateNumero() {
        int year = LocalDate.now().getYear();
        long count = blRepository.countByYear(year);
        return String.format("BL-%d-%04d", year, count + 1);
    }

    private LigneBonLivraison buildLigne(CreateBonLivraisonRequest.LigneRequest lr, BonLivraison bl) {
        BigDecimal montantHT = lr.prixUnitaireHT()
                .multiply(new BigDecimal(lr.quantite()))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal montantTva = montantHT
                .multiply(BigDecimal.valueOf(lr.tauxTva()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal montantTTC = montantHT.add(montantTva);

        LigneBonLivraison ligne = LigneBonLivraison.builder()
                .bonLivraison(bl)
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

    public BonLivraisonDTO toDTO(BonLivraison bl) {
        List<BonLivraisonDTO.LigneBonLivraisonDTO> lignesDTO = bl.getLignes().stream()
                .map(l -> new BonLivraisonDTO.LigneBonLivraisonDTO(
                        l.getId(),
                        l.getProduit() != null ? l.getProduit().getId() : null,
                        l.getDesignation(),
                        l.getQuantite(),
                        l.getPrixUnitaireHT(),
                        l.getTauxTva(),
                        l.getMontantHT(),
                        l.getMontantTva(),
                        l.getMontantTTC()
                ))
                .toList();

        return new BonLivraisonDTO(
                bl.getId(),
                bl.getNumero(),
                bl.getStatut() != null ? bl.getStatut().name() : null,
                bl.getDateCreation() != null ? bl.getDateCreation().toString() : null,
                bl.getDateLivraison() != null ? bl.getDateLivraison().format(DATE_FMT) : null,
                bl.getNotes(),
                bl.getCommande() != null ? bl.getCommande().getId() : null,
                bl.getCommande() != null ? bl.getCommande().getReference() : null,
                bl.getClient() != null ? clientService.toDTO(bl.getClient()) : null,
                bl.getFacture() != null ? bl.getFacture().getId() : null,
                bl.getFacture() != null ? bl.getFacture().getNumero() : null,
                lignesDTO,
                bl.getTotalHT(),
                bl.getTotalTva(),
                bl.getTotalTTC()
        );
    }

    private BonLivraison getOrThrow(Long id) {
        return blRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bon de livraison introuvable : " + id));
    }
}
