package com.pfe.facturation.service;

import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.entity.LigneFacture;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.FactureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Service de validation métier des factures.
 * Vérifie : taux TVA valides, cohérence mathématique, champs obligatoires.
 * Retourne une liste de {@link ValidationError} sans lever d'exception,
 * pour permettre une affichage complet des problèmes.
 */
@Service
@Transactional(readOnly = true)
public class FactureValidationService {

    private static final Logger log = LoggerFactory.getLogger(FactureValidationService.class);

    /** Taux TVA légaux en Tunisie */
    private static final Set<Double> TAUX_TVA_VALIDES = Set.of(0.0, 7.0, 13.0, 19.0);
    private static final BigDecimal DELTA = new BigDecimal("0.02"); // tolérance d'arrondi

    private final FactureRepository factureRepository;

    public FactureValidationService(FactureRepository factureRepository) {
        this.factureRepository = factureRepository;
    }

    /**
     * Valide une facture existante (par son ID).
     */
    public List<ValidationError> valider(Long factureId) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : id=" + factureId));

        List<ValidationError> erreurs = new ArrayList<>();

        // 1. Au moins une ligne
        if (facture.getLignes() == null || facture.getLignes().isEmpty()) {
            erreurs.add(new ValidationError("lignes", "La facture doit contenir au moins une ligne."));
        }

        // 2. Client obligatoire
        if (facture.getClient() == null) {
            erreurs.add(new ValidationError("client", "Un client doit être associé à la facture."));
        }

        // 3. Vérifier chaque ligne
        if (facture.getLignes() != null) {
            for (int i = 0; i < facture.getLignes().size(); i++) {
                LigneFacture ligne = facture.getLignes().get(i);
                String prefix = "Ligne " + (i + 1);

                // Taux TVA valide
                if (!TAUX_TVA_VALIDES.contains(ligne.getTauxTva())) {
                    erreurs.add(new ValidationError(
                            "ligne[" + i + "].tauxTva",
                            prefix + " : taux TVA invalide (" + ligne.getTauxTva()
                                    + "%). Valeurs autorisées : 0%, 7%, 13%, 19%."
                    ));
                }

                // Cohérence math : montantHT = prixUnitaireHT × quantité
                if (ligne.getPrixUnitaireHT() != null && ligne.getQuantite() > 0) {
                    BigDecimal calculé = ligne.getPrixUnitaireHT()
                            .multiply(new BigDecimal(ligne.getQuantite()))
                            .setScale(2, RoundingMode.HALF_UP);
                    BigDecimal persiste = ligne.getMontantHT() != null
                            ? ligne.getMontantHT().setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    if (calculé.subtract(persiste).abs().compareTo(DELTA) > 0) {
                        erreurs.add(new ValidationError(
                                "ligne[" + i + "].montantHT",
                                prefix + " : montant HT incohérent (calculé=" + calculé
                                        + ", persisté=" + persiste + ")."
                        ));
                    }
                }

                // Désignation non vide
                if (ligne.getDesignation() == null || ligne.getDesignation().isBlank()) {
                    erreurs.add(new ValidationError(
                            "ligne[" + i + "].designation",
                            prefix + " : la désignation est obligatoire."
                    ));
                }
            }
        }

        if (erreurs.isEmpty()) {
            log.info("Facture {} validée sans erreur.", facture.getNumero());
        } else {
            log.warn("Facture {} : {} erreur(s) détectée(s).", facture.getNumero(), erreurs.size());
        }

        return erreurs;
    }

    /**
     * Représente une erreur de validation métier.
     *
     * @param champ   nom du champ concerné (ex: "ligne[0].tauxTva")
     * @param message description lisible de l'erreur
     */
    public record ValidationError(String champ, String message) {}
}
