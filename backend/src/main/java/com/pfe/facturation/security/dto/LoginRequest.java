package com.pfe.facturation.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO pour la connexion.
 *
 * Changement v2 : authentification par username (identifiant de connexion)
 * au lieu de l'email. Le username est assigné par l'administrateur lors de
 * la création du compte (ex : "ahmed.benali", "EMP-042", etc.)
 */
@Data
public class LoginRequest {

    @NotBlank(message = "L'identifiant est obligatoire")
    private String username;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}
