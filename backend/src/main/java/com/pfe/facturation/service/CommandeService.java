package com.pfe.facturation.service;

import com.pfe.facturation.dto.*;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CommandeService {

    private static final Logger log = LoggerFactory.getLogger(CommandeService.class);

    private final CommandeRepository commandeRepository;
    private final ClientRepository clientRepository;
    private final VendeurRepository vendeurRepository;
    private final SiteRepository siteRepository;
    private final ProduitRepository produitRepository;
    private final DevisRepository devisRepository;

    private final ClientService clientService;
    private final VendeurService vendeurService;
    private final SiteService siteService;
    private final FactureService factureService;

    public CommandeService(CommandeRepository commandeRepository,
                           ClientRepository clientRepository,
                           VendeurRepository vendeurRepository,
                           SiteRepository siteRepository,
                           ProduitRepository produitRepository,
                           DevisRepository devisRepository,
                           ClientService clientService,
                           VendeurService vendeurService,
                           SiteService siteService,
                           @Lazy FactureService factureService) {
        this.commandeRepository = commandeRepository;
        this.clientRepository = clientRepository;
        this.vendeurRepository = vendeurRepository;
        this.siteRepository = siteRepository;
        this.produitRepository = produitRepository;
        this.devisRepository = devisRepository;
        this.clientService = clientService;
        this.vendeurService = vendeurService;
        this.siteService = siteService;
        this.factureService = factureService;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<CommandeDTO> findAll() {
        return commandeRepository.findAllByOrderByDateCommandeDesc()
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public CommandeDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<CommandeDTO> findByClient(Long clientId) {
        return commandeRepository.findByClientIdOrderByDateCommandeDesc(clientId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<CommandeDTO> findByStatut(StatutCommande statut) {
        return commandeRepository.findByStatutOrderByDateCommandeDesc(statut)
                .stream().map(this::toDTO).toList();
    }

    // ===== Création manuelle =====

    public CommandeDTO create(CreateCommandeRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + request.clientId()));

        Vendeur vendeur = vendeurRepository.findById(request.vendeurId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur introuvable : " + request.vendeurId()));

        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site introuvable : " + request.siteId()));

        Devis devis = null;
        if (request.devisId() != null) {
            devis = devisRepository.findById(request.devisId())
                    .orElseThrow(() -> new ResourceNotFoundException("Devis introuvable : " + request.devisId()));
        }

        String reference = generateReference();
        BigDecimal remise = request.remise() != null ? request.remise() : BigDecimal.ZERO;

        Commande commande = Commande.builder()
                .reference(reference)
                .client(client)
                .vendeur(vendeur)
                .site(site)
                .devis(devis)
                .notes(request.notes())
                .statut(StatutCommande.EN_ATTENTE)
                .remise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null)
                .build();

        commande.setDateCommande(
                request.dateCommande() != null
                        ? request.dateCommande().atStartOfDay()
                        : LocalDateTime.now()
        );

        List<LigneCommande> lignes = buildLignesFromCreate(request.lignes(), commande);
        BigDecimal[] totaux = calculerTotaux(lignes, remise);

        commande.setLignes(lignes);
        commande.setTotalHT(totaux[0]);
        commande.setTotalHT_apres_remise(totaux[1]);
        commande.setTotalTva(totaux[2]);
        commande.setTotalTTC(totaux[3]);

        Commande saved = commandeRepository.save(commande);
        log.info("Commande créée : {} (devisId={})", reference, request.devisId());
        return toDTO(saved);
    }

    // ===== Création automatique depuis un Devis (ACCEPTE → Commande) =====

    public CommandeDTO creerDepuisDevis(Devis devis) {
        String reference = generateReference();

        // Pour une commande auto-créée depuis devis, on prend le 1er vendeur & site disponibles
        // (l'utilisateur peut ensuite modifier)
        Vendeur vendeur = vendeurRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Aucun vendeur disponible pour créer la commande automatique."));
        Site site = siteRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Aucun site disponible pour créer la commande automatique."));

        BigDecimal remise = devis.getRemise() != null ? devis.getRemise() : BigDecimal.ZERO;

        Commande commande = Commande.builder()
                .reference(reference)
                .client(devis.getClient())
                .vendeur(vendeur)
                .site(site)
                .devis(devis)
                .notes("Commande générée automatiquement depuis le devis " + devis.getReference())
                .statut(StatutCommande.EN_ATTENTE)
                .remise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null)
                .build();

        commande.setDateCommande(LocalDateTime.now());

        // Copier les lignes du devis
        List<LigneCommande> lignes = devis.getLignes().stream()
                .map(ld -> LigneCommande.builder()
                        .commande(commande)
                        .produit(ld.getProduit())
                        .designation(ld.getDesignation())
                        .quantite(ld.getQuantite())
                        .prixUnitaireHT(ld.getPrixUnitaireHT())
                        .tauxTva(ld.getTauxTva())
                        .montantHT(ld.getMontantHT())
                        .montantTva(ld.getMontantTva())
                        .montantTTC(ld.getMontantTTC())
                        .build())
                .toList();

        BigDecimal[] totaux = calculerTotaux(lignes, remise);
        commande.setLignes(new ArrayList<>(lignes));
        commande.setTotalHT(totaux[0]);
        commande.setTotalHT_apres_remise(totaux[1]);
        commande.setTotalTva(totaux[2]);
        commande.setTotalTTC(totaux[3]);

        Commande saved = commandeRepository.save(commande);
        log.info("Commande {} créée automatiquement depuis devis {}", reference, devis.getReference());
        return toDTO(saved);
    }

    // ===== Mise à jour complète (PUT) =====

    public CommandeDTO update(Long id, UpdateCommandeRequest request) {
        Commande commande = getOrThrow(id);

        if (commande.getStatut() != StatutCommande.EN_ATTENTE) {
            throw new IllegalStateException(
                    "Modification impossible : la commande est en statut " + commande.getStatut() +
                    ". Seules les commandes EN_ATTENTE sont modifiables.");
        }

        BigDecimal remise = request.remise() != null ? request.remise() : BigDecimal.ZERO;

        // Reconstruire les lignes
        commande.getLignes().clear();
        List<LigneCommande> nouvellesLignes = buildLignesFromUpdate(request.lignes(), commande);
        BigDecimal[] totaux = calculerTotaux(nouvellesLignes, remise);

        commande.setDateCommande(
                request.dateCommande() != null
                        ? request.dateCommande().atStartOfDay()
                        : commande.getDateCommande()
        );
        commande.setNotes(request.notes());
        commande.setRemise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null);
        commande.getLignes().addAll(nouvellesLignes);
        commande.setTotalHT(totaux[0]);
        commande.setTotalHT_apres_remise(totaux[1]);
        commande.setTotalTva(totaux[2]);
        commande.setTotalTTC(totaux[3]);

        Commande saved = commandeRepository.save(commande);
        log.info("Commande {} mise à jour", commande.getReference());
        return toDTO(saved);
    }

    // ===== Changement de statut + déclenchement automatique =====

    public CommandeDTO updateStatut(Long id, UpdateStatutCommandeRequest request) {
        Commande commande = getOrThrow(id);
        StatutCommande ancienStatut = commande.getStatut();
        StatutCommande nouveauStatut = request.statut();

        validerTransition(ancienStatut, nouveauStatut);

        commande.setStatut(nouveauStatut);
        Commande saved = commandeRepository.save(commande);
        log.info("Commande {} : statut changé de {} → {}", commande.getReference(), ancienStatut, nouveauStatut);

        // ── Flux automatique : VALIDEE → création d'une Facture ───────────────
        if (nouveauStatut == StatutCommande.VALIDEE) {
            factureService.creerDepuisCommande(saved);
        }

        return toDTO(saved);
    }

    // ===== Suppression =====

    public void delete(Long id) {
        Commande commande = getOrThrow(id);
        if (commande.getStatut() == StatutCommande.LIVREE || commande.getStatut() == StatutCommande.VALIDEE) {
            throw new IllegalStateException("Impossible de supprimer une commande validée ou livrée.");
        }
        commandeRepository.deleteById(id);
        log.info("Commande supprimée : id={}", id);
    }

    // ===== Méthodes privées =====

    private synchronized String generateReference() {
        int year = LocalDate.now().getYear();
        long count = commandeRepository.countByYear(year);
        return String.format("CMD-%d-%04d", year, count + 1);
    }

    /** Calcule [totalHT, totalHTApresRemise, totalTva, totalTTC] */
    private BigDecimal[] calculerTotaux(List<LigneCommande> lignes, BigDecimal remisePct) {
        BigDecimal totalHT = lignes.stream()
                .map(LigneCommande::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalHTApresRemise;
        BigDecimal ratioRemise;
        if (remisePct != null && remisePct.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal facteur = BigDecimal.ONE
                    .subtract(remisePct.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
            totalHTApresRemise = totalHT.multiply(facteur).setScale(2, RoundingMode.HALF_UP);
            ratioRemise = totalHT.compareTo(BigDecimal.ZERO) > 0
                    ? totalHTApresRemise.divide(totalHT, 10, RoundingMode.HALF_UP)
                    : BigDecimal.ONE;
        } else {
            totalHTApresRemise = totalHT;
            ratioRemise = BigDecimal.ONE;
        }

        BigDecimal totalTva = lignes.stream()
                .map(LigneCommande::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(ratioRemise)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalTTC = totalHTApresRemise.add(totalTva).setScale(2, RoundingMode.HALF_UP);

        return new BigDecimal[]{totalHT, totalHTApresRemise, totalTva, totalTTC};
    }

    private List<LigneCommande> buildLignesFromCreate(
            List<CreateCommandeRequest.LigneCommandeRequest> reqs, Commande commande) {
        List<LigneCommande> lignes = new ArrayList<>();
        for (var lreq : reqs) {
            lignes.add(buildLigneBase(
                    lreq.produitId(), lreq.designation(),
                    lreq.quantite(), lreq.prixUnitaireHT(), lreq.tauxTva(), commande));
        }
        return lignes;
    }

    private List<LigneCommande> buildLignesFromUpdate(
            List<UpdateCommandeRequest.LigneCommandeRequest> reqs, Commande commande) {
        List<LigneCommande> lignes = new ArrayList<>();
        for (var lreq : reqs) {
            lignes.add(buildLigneBase(
                    lreq.produitId(), lreq.designation(),
                    lreq.quantite(), lreq.prixUnitaireHT(), lreq.tauxTva(), commande));
        }
        return lignes;
    }

    private LigneCommande buildLigneBase(Long produitId, String designation,
                                          int quantite, BigDecimal prixHT, Double tauxTva,
                                          Commande commande) {
        BigDecimal qte = new BigDecimal(quantite);
        BigDecimal montantHT = prixHT.multiply(qte).setScale(2, RoundingMode.HALF_UP);
        BigDecimal montantTva = montantHT
                .multiply(BigDecimal.valueOf(tauxTva))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        Produit produit = null;
        if (produitId != null) {
            produit = produitRepository.findById(produitId)
                    .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + produitId));
        }

        return LigneCommande.builder()
                .commande(commande)
                .produit(produit)
                .designation(designation)
                .quantite(quantite)
                .prixUnitaireHT(prixHT)
                .tauxTva(tauxTva)
                .montantHT(montantHT)
                .montantTva(montantTva)
                .montantTTC(montantHT.add(montantTva))
                .build();
    }

    private void validerTransition(StatutCommande ancien, StatutCommande nouveau) {
        boolean valide = switch (ancien) {
            case EN_ATTENTE -> nouveau == StatutCommande.VALIDEE || nouveau == StatutCommande.ANNULEE;
            case VALIDEE    -> nouveau == StatutCommande.LIVREE  || nouveau == StatutCommande.ANNULEE;
            case LIVREE, ANNULEE -> false;
        };
        if (!valide) {
            throw new IllegalStateException(
                    String.format("Transition invalide : %s → %s", ancien, nouveau));
        }
    }

    public CommandeDTO toDTO(Commande c) {
        List<CommandeDTO.LigneCommandeDTO> lignesDTO = c.getLignes() != null
                ? c.getLignes().stream().map(l -> new CommandeDTO.LigneCommandeDTO(
                        l.getId(),
                        l.getProduit() != null ? l.getProduit().getId() : null,
                        l.getDesignation(),
                        l.getQuantite(),
                        l.getPrixUnitaireHT(),
                        l.getTauxTva(),
                        l.getMontantHT(),
                        l.getMontantTva(),
                        l.getMontantTTC()
                )).toList()
                : new ArrayList<>();

        return new CommandeDTO(
                c.getId(),
                c.getReference(),
                c.getStatut() != null ? c.getStatut().name() : null,
                c.getDateCommande() != null ? c.getDateCommande().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null,
                c.getClient() != null ? clientService.toDTO(c.getClient()) : null,
                c.getVendeur() != null ? vendeurService.toDTO(c.getVendeur()) : null,
                c.getSite() != null ? siteService.toDTO(c.getSite()) : null,
                c.getDevis() != null ? c.getDevis().getId() : null,
                c.getNotes(),
                c.getRemise(),
                c.getTotalHT(),
                c.getTotalHT_apres_remise(),
                c.getTotalTva(),
                c.getTotalTTC(),
                lignesDTO
        );
    }

    private Commande getOrThrow(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'id : " + id));
    }
}
