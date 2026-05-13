package com.pfe.facturation.service;

import com.pfe.facturation.dto.*;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
    private final ProduitService produitService;

    public CommandeService(CommandeRepository commandeRepository,
                           ClientRepository clientRepository,
                           VendeurRepository vendeurRepository,
                           SiteRepository siteRepository,
                           ProduitRepository produitRepository,
                           DevisRepository devisRepository,
                           ClientService clientService,
                           VendeurService vendeurService,
                           SiteService siteService,
                           ProduitService produitService) {
        this.commandeRepository = commandeRepository;
        this.clientRepository = clientRepository;
        this.vendeurRepository = vendeurRepository;
        this.siteRepository = siteRepository;
        this.produitRepository = produitRepository;
        this.devisRepository = devisRepository;
        this.clientService = clientService;
        this.vendeurService = vendeurService;
        this.siteService = siteService;
        this.produitService = produitService;
    }

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

        Commande commande = Commande.builder()
                .reference(reference)
                .client(client)
                .vendeur(vendeur)
                .site(site)
                .devis(devis)
                .notes(request.notes())
                .statut(StatutCommande.EN_ATTENTE)
                .build();
                
        if (request.dateCommande() != null) {
            commande.setDateCommande(request.dateCommande().atStartOfDay());
        } else {
            commande.setDateCommande(java.time.LocalDateTime.now());
        }

        java.math.BigDecimal totalTTC = java.math.BigDecimal.ZERO;
        java.util.List<LigneCommande> lignes = new java.util.ArrayList<>();

        for (CreateCommandeRequest.LigneCommandeRequest lreq : request.lignes()) {
            Produit produit = null;
            if (lreq.produitId() != null) {
                produit = produitRepository.findById(lreq.produitId())
                        .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + lreq.produitId()));
            }

            java.math.BigDecimal qte = new java.math.BigDecimal(lreq.quantite());
            java.math.BigDecimal montantHT = lreq.prixUnitaireHT().multiply(qte);
            java.math.BigDecimal montantTva = montantHT.multiply(java.math.BigDecimal.valueOf(lreq.tauxTva() / 100));
            java.math.BigDecimal montantLigneTTC = montantHT.add(montantTva);

            LigneCommande ligne = LigneCommande.builder()
                    .commande(commande)
                    .produit(produit)
                    .designation(lreq.designation())
                    .quantite(lreq.quantite())
                    .prixUnitaireHT(lreq.prixUnitaireHT())
                    .tauxTva(lreq.tauxTva())
                    .montantHT(montantHT)
                    .montantTva(montantTva)
                    .montantTTC(montantLigneTTC)
                    .build();
            
            lignes.add(ligne);
            totalTTC = totalTTC.add(montantLigneTTC);
        }

        commande.setLignes(lignes);
        commande.setTotalTTC(totalTTC);

        Commande saved = commandeRepository.save(commande);
        log.info("Commande créée : {}", reference);
        return toDTO(saved);
    }

    public CommandeDTO updateStatut(Long id, UpdateStatutCommandeRequest request) {
        Commande commande = getOrThrow(id);
        StatutCommande ancienStatut = commande.getStatut();
        StatutCommande nouveauStatut = request.statut();

        validerTransition(ancienStatut, nouveauStatut);

        commande.setStatut(nouveauStatut);
        Commande saved = commandeRepository.save(commande);
        log.info("Commande {} : statut changé de {} → {}", commande.getReference(), ancienStatut, nouveauStatut);
        return toDTO(saved);
    }

    public void delete(Long id) {
        Commande commande = getOrThrow(id);
        if (commande.getStatut() == StatutCommande.LIVREE || commande.getStatut() == StatutCommande.VALIDEE) {
            throw new IllegalStateException("Impossible de supprimer une commande validée ou livrée.");
        }
        commandeRepository.deleteById(id);
        log.info("Commande supprimée : id={}", id);
    }

    private synchronized String generateReference() {
        int year = LocalDate.now().getYear();
        long count = commandeRepository.countByYear(year);
        return String.format("CMD-%d-%04d", year, count + 1);
    }

    private void validerTransition(StatutCommande ancien, StatutCommande nouveau) {
        boolean valide = switch (ancien) {
            case EN_ATTENTE -> nouveau == StatutCommande.VALIDEE || nouveau == StatutCommande.ANNULEE;
            case VALIDEE    -> nouveau == StatutCommande.LIVREE || nouveau == StatutCommande.ANNULEE;
            case LIVREE, ANNULEE -> false; // États terminaux
        };
        if (!valide) {
            throw new IllegalStateException(
                    String.format("Transition invalide : %s → %s", ancien, nouveau));
        }
    }

    public CommandeDTO toDTO(Commande c) {
        java.util.List<CommandeDTO.LigneCommandeDTO> lignesDTO = c.getLignes() != null ? 
                c.getLignes().stream().map(l -> new CommandeDTO.LigneCommandeDTO(
                        l.getId(),
                        l.getProduit() != null ? l.getProduit().getId() : null,
                        l.getDesignation(),
                        l.getQuantite(),
                        l.getPrixUnitaireHT(),
                        l.getTauxTva(),
                        l.getMontantHT(),
                        l.getMontantTva(),
                        l.getMontantTTC()
                )).toList() : new java.util.ArrayList<>();

        return new CommandeDTO(
                c.getId(),
                c.getReference(),
                c.getStatut() != null ? c.getStatut().name() : null,
                c.getDateCommande() != null ? c.getDateCommande().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null,
                c.getTotalTTC(),
                c.getClient() != null ? clientService.toDTO(c.getClient()) : null,
                c.getVendeur() != null ? vendeurService.toDTO(c.getVendeur()) : null,
                c.getSite() != null ? siteService.toDTO(c.getSite()) : null,
                c.getDevis() != null ? c.getDevis().getId() : null,
                c.getNotes(),
                lignesDTO
        );
    }

    private Commande getOrThrow(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable avec l'id : " + id));
    }
}
