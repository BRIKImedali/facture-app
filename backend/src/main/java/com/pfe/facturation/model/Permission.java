// Permission.java — Entité JPA pour les permissions granulaires du système
package com.pfe.facturation.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Entité représentant une permission granulaire dans le système.
 * Format : ENTITY:ACTION (ex: FACTURE:CREATE, CLIENT:DELETE, SYSTEM:CONFIG)
 * 
 * Chaque permission est unique (combinaison entity + action).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"entity", "action"})
})
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Entité concernée : FACTURE, CLIENT, PRODUIT, USER, ROLE, SYSTEM, RAPPORT
     */
    @NotBlank(message = "L'entité est obligatoire")
    @Column(nullable = false, length = 50)
    private String entity;

    /**
     * Action : CREATE, READ, UPDATE, DELETE, EXPORT, APPROVE, CONFIG, AUDIT
     */
    @NotBlank(message = "L'action est obligatoire")
    @Column(nullable = false, length = 50)
    private String action;

    /** Description lisible de la permission */
    @Column(length = 255)
    private String description;

    /**
     * Retourne la permission au format ENTITY:ACTION.
     * Utilisé par le CustomPermissionEvaluator.
     */
    public String getPermissionString() {
        return entity + ":" + action;
    }
}
