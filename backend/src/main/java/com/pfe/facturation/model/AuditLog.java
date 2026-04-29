// AuditLog.java — Entité JPA pour la traçabilité complète des actions
package com.pfe.facturation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entité représentant un enregistrement d'audit (log de traçabilité).
 * Capture TOUTES les actions importantes : CRUD, connexions, modifications de config.
 * 
 * Les champs old_value et new_value sont stockés en JSON (TEXT en PostgreSQL).
 * Pour PostgreSQL natif, on pourrait utiliser @Type(JsonType.class) de hypersistence.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_audit_date", columnList = "created_at"),
    @Index(name = "idx_audit_action", columnList = "action_type")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID de l'utilisateur qui a effectué l'action (peut être null pour actions système) */
    @Column(name = "user_id")
    private Long userId;

    /** Username de l'utilisateur (dénormalisé pour garder trace même si user supprimé) */
    @Column(name = "username", length = 255)
    private String username;

    /**
     * Type d'action effectuée :
     * CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT,
     * CONFIG_CHANGE, ROLE_CHANGE, PASSWORD_RESET, ERP_SYNC
     */
    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    /** Type d'entité modifiée : Facture, Client, Produit, User, AppRole, DatabaseProfile */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** ID de l'entité modifiée */
    @Column(name = "entity_id")
    private Long entityId;

    /** Ancienne valeur en JSON (avant modification) */
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    /** Nouvelle valeur en JSON (après modification) */
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    /** Adresse IP du client qui a effectué l'action */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    /** Timestamp de l'action */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Message descriptif supplémentaire */
    @Column(name = "description", length = 500)
    private String description;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
