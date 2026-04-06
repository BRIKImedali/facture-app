package com.pfe.facturation.security.entity;

/**
 * Enum des rôles disponibles dans l'application.
 * ADMIN : peut tout faire (gérer les utilisateurs, voir les rapports)
 * USER  : accès standard (gérer clients, factures, etc.)
 */
public enum Role {
    ADMIN,
    USER
}
