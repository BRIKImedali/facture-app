package com.pfe.facturation.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

/**
 * DTO de réponse après connexion réussie.
 * Ces données sont stockées côté client (localStorage) et utilisées
 * pour adapter l'interface (menus, boutons selon permissions).
 *
 * Changement v2 :
 * - 'email' remplacé par 'username' (identifiant de connexion)
 * - 'permissions' ajouté pour le contrôle d'accès côté frontend
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    /** Token JWT à envoyer dans les headers Authorization: Bearer <token> */
    private String token;

    /** Identifiant de connexion de l'utilisateur */
    private String username;

    /** Nom de famille */
    private String nom;

    /** Prénom */
    private String prenom;

    /** Rôle système : ADMIN ou USER */
    private String role;

    /** Liste des permissions granulaires (FACTURE:CREATE, CLIENT:READ, ...) */
    private List<String> permissions;
}
