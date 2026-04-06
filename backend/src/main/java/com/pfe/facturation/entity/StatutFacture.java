package com.pfe.facturation.entity;

/**
 * Statuts possibles d'une facture.
 * Transitions valides :
 *   BROUILLON → ENVOYEE → PAYEE
 *   BROUILLON → ANNULEE
 *   ENVOYEE   → ANNULEE
 */
public enum StatutFacture {
    /** Brouillon : facture en cours de rédaction, non transmise */
    BROUILLON,
    /** Envoyée : facture transmise au client, en attente de paiement */
    ENVOYEE,
    /** Payée : paiement confirmé */
    PAYEE,
    /** Annulée : facture annulée */
    ANNULEE
}
