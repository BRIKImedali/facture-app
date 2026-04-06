package com.pfe.facturation.security.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO de réponse après connexion/inscription réussie.
 * Ce sont les données que le frontend React va recevoir et stocker.
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;      // Le token JWT à utiliser pour les prochaines requêtes
    private String email;      // Email de l'utilisateur connecté
    private String nom;        // Pour afficher dans l'interface (ex: "Bonjour, Mohamed")
    private String prenom;
    private String role;       // ADMIN ou USER (pour adapter l'interface côté React)
}
