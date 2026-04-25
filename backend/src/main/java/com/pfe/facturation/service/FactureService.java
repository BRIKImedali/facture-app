package com.pfe.facturation.service;

import com.pfe.facturation.dto.CreateFactureRequest;
import com.pfe.facturation.dto.FactureResponseDTO;
import com.pfe.facturation.dto.UpdateStatutRequest;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
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
    private final ClientService clientService;

    public FactureService(FactureRepository factureRepository,
                          ClientRepository clientRepository,
                          ProduitRepository produitRepository,
                          ClientService clientService) {
        this.factureRepository = factureRepository;
        this.clientRepository = clientRepository;
        this.produitRepository = produitRepository;
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

    // ===== Création =====

    public FactureResponseDTO create(CreateFactureRequest request, User creator) {
        // 1. Vérifier que le client existe
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client introuvable avec l'id : " + request.clientId()));

        // 2. Générer le numéro de facture avant de sauvegarder
        String numero = generateNumero();

        // 3. Construire les lignes et calculer les totaux
        List<LigneFacture> lignes = request.lignes().stream()
                .map(lr -> buildLigne(lr))
                .toList();

        BigDecimal totalHT = lignes.stream()
                .map(LigneFacture::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTva = lignes.stream()
                .map(LigneFacture::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTTC = totalHT.add(totalTva);

        // 4. Construire et sauvegarder la facture
        Facture facture = Facture.builder()
                .numero(numero)
                .client(client)
                .createdBy(creator)
                .statut(StatutFacture.BROUILLON)
                .dateEcheance(request.dateEcheance())
                .notes(request.notes())
                .totalHT(totalHT.setScale(2, RoundingMode.HALF_UP))
                .totalTva(totalTva.setScale(2, RoundingMode.HALF_UP))
                .totalTTC(totalTTC.setScale(2, RoundingMode.HALF_UP))
                .paymentMethod(request.paymentMethod() != null ? PaymentMethod.valueOf(request.paymentMethod()) : null)
                .build();

        Facture saved = factureRepository.save(facture);

        // 5. Associer les lignes à la facture sauvegardée
        lignes.forEach(l -> l.setFacture(saved));
        saved.getLignes().addAll(lignes);
        Facture withLignes = factureRepository.save(saved);

        log.info("Facture créée : {} pour le client {}", numero, client.getNom());
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
                f.getTotalTva(),
                f.getTotalTTC(),
                f.getPaymentMethod() != null ? f.getPaymentMethod().name() : null
        );
    }

    private Facture getOrThrow(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable avec l'id : " + id));
    }
}
