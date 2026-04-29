package com.pfe.facturation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Entité ClientCategory — catégorie d'un client.
 * La clé primaire est le code (ex: "ENT" pour Entreprise, "PART" pour Particulier).
 *
 * Design choice : code as PK (as requested) — stable, human-readable,
 * and used directly in Client as FK.
 * Mappée sur la table "client_categories".
 */
@Entity
@Table(name = "client_categories")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientCategory {

    /**
     * Code unique (clé primaire), ex: "ENT", "PART", "ADM", "ASS".
     * Saisie en majuscules par convention.
     */
    @Id
    @Column(length = 20)
    private String code;

    /**
     * Description lisible de la catégorie.
     * Ex: "Entreprise", "Particulier", "Administration", "Association"
     */
    @NotBlank(message = "La description de la catégorie est obligatoire")
    @Column(nullable = false, length = 100)
    private String description;
}
