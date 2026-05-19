package com.pfe.facturation.service;

import com.pfe.facturation.dto.CreateFactureDepuisBLRequest;
import com.pfe.facturation.dto.CreateFactureRequest;
import com.pfe.facturation.dto.FactureResponseDTO;
import com.pfe.facturation.dto.UpdateStatutRequest;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.BonLivraisonRepository;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.repository.ProduitRepository;
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
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

@Service
@Transactional
public class FactureService {

    private static final Logger log = LoggerFactory.getLogger(FactureService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final FactureRepository factureRepository;
    private final ClientRepository clientRepository;
    private final ProduitRepository produitRepository;
    private final BonLivraisonRepository bonLivraisonRepository;
    private final ClientService clientService;

    public FactureService(FactureRepository factureRepository,
                          ClientRepository clientRepository,
                          ProduitRepository produitRepository,
                          BonLivraisonRepository bonLivraisonRepository,
                          ClientService clientService) {
        this.factureRepository = factureRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
        this.bonLivraisonRepository = bonLivraisonRepository;
        this.clientService = clientService;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<FactureResponseDTO> findAll() {
        return factureRepository.findAllByOrderByDateEmissionDesc()
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public FactureResponseDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<FactureResponseDTO> findByClient(Long clientId) {
        return factureRepository.findByClientIdOrderByDateEmissionDesc(clientId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<FactureResponseDTO> findByStatut(StatutFacture statut) {
        return factureRepository.findByStatutOrderByDateEmissionDesc(statut)
                .stream().map(this::toDTO).toList();
    }

    /** Stats pour le dashboard */
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        long totalClients = clientRepository.count();
        long totalProduits = produitRepository.count();
        long totalFactures = factureRepository.count();
        BigDecimal caTotal = factureRepository.sumTotalTTCPayees(StatutFacture.PAYEE);

        // Top 5 Clients
        List<Map<String, Object>> topClients = factureRepository.findTopClientsByRevenue(StatutFacture.PAYEE, PageRequest.of(0, 5))
                .stream()
                .map(row -> {
                    Client c = (Client) row[0];
                    BigDecimal ca = (BigDecimal) row[1];
                    return (Map<String, Object>) Map.of(
                            "id", (Object) c.getId(),
                            "nom", (Object) c.getNom(),
                            "ca", (Object) ca
                    );
                })
                .collect(Collectors.toList());

        // CA par Mois sur l'année en cours
        int currentYear = LocalDate.now().getYear();
        List<Map<String, Object>> revenueByMonth = factureRepository.findRevenueByMonth(StatutFacture.PAYEE, currentYear)
                .stream()
                .map(row -> (Map<String, Object>) Map.of(
                        "mois", (Object) row[0],
                        "ca", (Object) row[1]
                ))
                .collect(Collectors.toList());

        return Map.of(
                "totalClients", totalClients,
                "totalProduits", totalProduits,
                "totalFactures", totalFactures,
                "chiffreAffaires", caTotal != null ? caTotal : BigDecimal.ZERO,
                "topClients", topClients,
                "revenueByMonth", revenueByMonth
        );
    }

    // ===== Création manuelle =====

    public FactureResponseDTO create(CreateFactureRequest request, User creator) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client introuvable avec l'id : " + request.clientId()));

        String numero = generateNumero();

        List<LigneFacture> lignes = request.lignes().stream()
                .map(this::buildLigne)
                .toList();

        BigDecimal remise = request.remise() != null ? request.remise() : BigDecimal.ZERO;
        BigDecimal[] totaux = calculerTotaux(lignes, remise);

        Facture facture = Facture.builder()
                .numero(numero)
                .client(client)
                .createdBy(creator)
                .statut(StatutFacture.BROUILLON)
                .dateEcheance(request.dateEcheance())
                .notes(request.notes())
                .remise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null)
                .totalHT(totaux[0])
                .totalHT_apres_remise(totaux[1])
                .totalTva(totaux[2])
                .totalTTC(totaux[3])
                .paymentMethod(request.paymentMethod() != null ? PaymentMethod.valueOf(request.paymentMethod()) : null)
                .build();

        Facture saved = factureRepository.save(facture);
        lignes.forEach(l -> l.setFacture(saved));
        saved.getLignes().addAll(lignes);
        Facture withLignes = factureRepository.save(saved);

        log.info("Facture créée : {} pour le client {}", numero, client.getNom());
        return toDTO(withLignes);
    }

    // ===== Création automatique depuis une Commande (VALIDEE → Facture) =====

    public FactureResponseDTO creerDepuisCommande(Commande commande) {
        String numero = generateNumero();
        BigDecimal remise = commande.getRemise() != null ? commande.getRemise() : BigDecimal.ZERO;

        // Copier les lignes de la commande vers la facture
        Facture facture = Facture.builder()
                .numero(numero)
                .client(commande.getClient())
                .statut(StatutFacture.BROUILLON)
                .notes("Facture générée automatiquement depuis la commande " + commande.getReference())
                .remise(remise.compareTo(BigDecimal.ZERO) > 0 ? remise : null)
                .totalHT(commande.getTotalHT())
                .totalHT_apres_remise(commande.getTotalHT_apres_remise())
                .totalTva(commande.getTotalTva())
                .totalTTC(commande.getTotalTTC())
                .paymentMethod(commande.getPaymentMethod())
                .build();

        Facture savedFacture = factureRepository.save(facture);

        List<LigneFacture> lignes = commande.getLignes().stream()
                .map(lc -> LigneFacture.builder()
                        .facture(savedFacture)
                        .produit(lc.getProduit())
                        .designation(lc.getDesignation())
                        .quantite(lc.getQuantite())
                        .prixUnitaireHT(lc.getPrixUnitaireHT())
                        .tauxTva(lc.getTauxTva())
                        .montantHT(lc.getMontantHT())
                        .montantTva(lc.getMontantTva())
                        .montantTTC(lc.getMontantTTC())
                        .build())
                .toList();

        savedFacture.getLignes().addAll(lignes);
        Facture withLignes = factureRepository.save(savedFacture);

        log.info("Facture {} créée automatiquement depuis commande {}", numero, commande.getReference());
        return toDTO(withLignes);
    }

    // ===== Création depuis des Bons de Livraison (facturation groupée) =====

    public FactureResponseDTO creerDepuisBonsLivraison(CreateFactureDepuisBLRequest request, User creator) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + request.clientId()));

        List<BonLivraison> bls = bonLivraisonRepository.findAllById(request.bonLivraisonIds());
        if (bls.size() != request.bonLivraisonIds().size()) {
            throw new IllegalArgumentException("Un ou plusieurs bons de livraison sont introuvables.");
        }

        for (BonLivraison bl : bls) {
            if (!bl.getClient().getId().equals(request.clientId())) {
                throw new IllegalArgumentException(
                        "Le bon de livraison " + bl.getNumero() + " n'appartient pas au client sélectionné.");
            }
            if (bl.getStatut() != StatutBonLivraison.LIVRE) {
                throw new IllegalStateException(
                        "Le bon de livraison " + bl.getNumero() + " n'est pas au statut LIVRE.");
            }
            if (bl.getFacture() != null) {
                throw new IllegalStateException(
                        "Le bon de livraison " + bl.getNumero() + " est déjà facturé (facture " + bl.getFacture().getNumero() + ").");
            }
        }

        // Consolider les lignes de tous les BL
        List<LigneFacture> lignes = bls.stream()
                .flatMap(bl -> bl.getLignes().stream())
                .map(lbl -> LigneFacture.builder()
                        .produit(lbl.getProduit())
                        .designation(lbl.getDesignation())
                        .quantite(lbl.getQuantite())
                        .prixUnitaireHT(lbl.getPrixUnitaireHT())
                        .tauxTva(lbl.getTauxTva())
                        .montantHT(lbl.getMontantHT())
                        .montantTva(lbl.getMontantTva())
                        .montantTTC(lbl.getMontantTTC())
                        .build())
                .toList();

        BigDecimal remise = BigDecimal.ZERO;
        BigDecimal[] totaux = calculerTotaux(lignes, remise);

        String numero = generateNumero();
        Facture facture = Facture.builder()
                .numero(numero)
                .client(client)
                .createdBy(creator)
                .statut(StatutFacture.BROUILLON)
                .type(TypeFacture.GROUPEE_BL)
                .dateEcheance(request.dateEcheance())
                .notes(request.notes())
                .totalHT(totaux[0])
                .totalHT_apres_remise(totaux[1])
                .totalTva(totaux[2])
                .totalTTC(totaux[3])
                .paymentMethod(request.paymentMethod() != null ? PaymentMethod.valueOf(request.paymentMethod()) : null)
                .build();

        Facture savedFacture = factureRepository.save(facture);
        lignes.forEach(l -> l.setFacture(savedFacture));
        savedFacture.getLignes().addAll(lignes);
        Facture withLignes = factureRepository.save(savedFacture);

        // Marquer les BL comme facturés
        bls.forEach(bl -> bl.setFacture(withLignes));
        bonLivraisonRepository.saveAll(bls);

        log.info("Facture groupée {} créée depuis {} BL pour le client {}", numero, bls.size(), client.getNom());
        return toDTO(withLignes);
    }

    // ===== Mise à jour du statut =====

    public FactureResponseDTO updateStatut(Long id, UpdateStatutRequest request) {
        Facture facture = getOrThrow(id);
        StatutFacture ancienStatut = facture.getStatut();
        StatutFacture nouveauStatut = request.statut();

        // Vérifier les transitions valides
        validerTransition(ancienStatut, nouveauStatut);

        facture.setStatut(nouveauStatut);
        if (request.paymentMethod() != null) {
            facture.setPaymentMethod(PaymentMethod.valueOf(request.paymentMethod()));
        }
        Facture saved = factureRepository.save(facture);
        log.info("Facture {} : statut changé de {} → {}", facture.getNumero(), ancienStatut, nouveauStatut);
        return toDTO(saved);
    }

    // ===== Suppression =====

    public void delete(Long id) {
        Facture facture = getOrThrow(id);
        if (facture.getStatut() == StatutFacture.PAYEE) {
            throw new IllegalStateException("Impossible de supprimer une facture payée.");
        }
        factureRepository.deleteById(id);
        log.info("Facture supprimée : id={}", id);
    }

    // ===== Méthodes privées =====

    /**
     * Génère un numéro de facture unique au format FAC-YYYY-XXXX.
     * Synchronisé pour éviter les doublons en cas d'appels concurrents.
     */
    private synchronized String generateNumero() {
        int year = LocalDate.now().getYear();
        long count = factureRepository.countByYear(year);
        return String.format("FAC-%d-%04d", year, count + 1);
    }

    /** Calcule [totalHT, totalHTApresRemise, totalTva, totalTTC] */
    private BigDecimal[] calculerTotaux(List<LigneFacture> lignes, BigDecimal remisePct) {
        BigDecimal totalHT = lignes.stream()
                .map(LigneFacture::getMontantHT)
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
                .map(LigneFacture::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(ratioRemise)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalTTC = totalHTApresRemise.add(totalTva).setScale(2, RoundingMode.HALF_UP);
        return new BigDecimal[]{totalHT, totalHTApresRemise, totalTva, totalTTC};
    }

    /** Construit une LigneFacture et calcule ses montants */
    private LigneFacture buildLigne(CreateFactureRequest.LigneRequest lr) {
        BigDecimal montantHT = lr.prixUnitaireHT()
                .multiply(new BigDecimal(lr.quantite()))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal montantTva = montantHT
                .multiply(BigDecimal.valueOf(lr.tauxTva()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal montantTTC = montantHT.add(montantTva);

        LigneFacture ligne = LigneFacture.builder()
                .designation(lr.designation())
                .quantite(lr.quantite())
                .prixUnitaireHT(lr.prixUnitaireHT())
                .tauxTva(lr.tauxTva())
                .montantHT(montantHT)
                .montantTva(montantTva)
                .montantTTC(montantTTC)
                .build();

        // Si un produit est référencé, on l'associe
        if (lr.produitId() != null) {
            produitRepository.findById(lr.produitId())
                    .ifPresent(ligne::setProduit);
        }

        return ligne;
    }

    /** Valide que la transition de statut est autorisée */
    private void validerTransition(StatutFacture ancien, StatutFacture nouveau) {
        boolean valide = switch (ancien) {
            case BROUILLON -> nouveau == StatutFacture.ENVOYEE || nouveau == StatutFacture.ANNULEE;
            case ENVOYEE   -> nouveau == StatutFacture.PAYEE   || nouveau == StatutFacture.ANNULEE;
            case PAYEE, ANNULEE -> false; // États terminaux
        };
        if (!valide) {
            throw new IllegalStateException(
                    String.format("Transition invalide : %s → %s", ancien, nouveau));
        }
    }

    /** Convertit une entité Facture en DTO de réponse */
    public FactureResponseDTO toDTO(Facture f) {
        List<FactureResponseDTO.LigneResponseDTO> lignesDTO = f.getLignes().stream()
                .map(l -> new FactureResponseDTO.LigneResponseDTO(
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

        return new FactureResponseDTO(
                f.getId(),
                f.getNumero(),
                f.getStatut() != null ? f.getStatut().name() : null,
                f.getDateEmission() != null ? f.getDateEmission().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null,
                f.getDateEcheance() != null ? f.getDateEcheance().format(DATE_FMT) : null,
                f.getNotes(),
                f.getCreatedBy() != null ? f.getCreatedBy().getUsername() : null,
                f.getClient() != null ? clientService.toDTO(f.getClient()) : null,
                lignesDTO,
                f.getTotalHT(),
                f.getRemise(),
                f.getTotalHT_apres_remise(),
                f.getTotalTva(),
                f.getTotalTTC(),
                f.getPaymentMethod() != null ? f.getPaymentMethod().name() : null,
                f.getType() != null ? f.getType().name() : TypeFacture.CLASSIQUE.name()
        );
    }

    private Facture getOrThrow(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable avec l'id : " + id));
    }
}
