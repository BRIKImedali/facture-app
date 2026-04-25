package com.pfe.facturation.entity;

/**
 * Enum PaymentMethod — mode de paiement d'une facture.
 *
 * Stored as STRING in the database (EnumType.STRING) for readability
 * and migration safety.
 *
 * Values:
 *  - ESPECES   : Paiement en espèces (cash)
 *  - VIREMENT  : Virement bancaire (bank transfer)
 *  - CHEQUE    : Paiement par chèque (check)
 */
public enum PaymentMethod {
    /** Paiement en espèces */
    ESPECES,

    /** Virement bancaire */
    VIREMENT,

    /** Paiement par chèque */
    CHEQUE
}
