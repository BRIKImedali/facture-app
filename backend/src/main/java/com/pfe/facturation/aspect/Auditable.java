// Auditable.java — Annotation personnalisée pour l'audit automatique via AOP
package com.pfe.facturation.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation @Auditable — À placer sur les méthodes de service à tracer.
 * 
 * Exemple d'utilisation :
 * @Auditable(action = "CREATE", entity = "Client")
 * public Client createClient(ClientDTO dto) { ... }
 * 
 * Le AuditAspect interceptera automatiquement l'appel et enregistrera
 * un log d'audit avec : qui, quoi, quand, IP, avant/après.
 */
@Target(ElementType.METHOD)  // S'applique uniquement sur les méthodes
@Retention(RetentionPolicy.RUNTIME)  // Disponible à l'exécution (nécessaire pour AOP)
public @interface Auditable {

    /**
     * Type d'action effectuée : CREATE, UPDATE, DELETE, READ, EXPORT,
     * CONFIG_CHANGE, ROLE_CHANGE, PASSWORD_RESET, LOGIN, LOGOUT, ERP_SYNC
     */
    String action() default "ACTION";

    /**
     * Nom de l'entité concernée : Client, Facture, Produit, User, AppRole,
     * DatabaseProfile, ErpConfig, Permission
     */
    String entity() default "ENTITY";

    /**
     * Message descriptif optionnel pour le log d'audit.
     */
    String description() default "";
}
