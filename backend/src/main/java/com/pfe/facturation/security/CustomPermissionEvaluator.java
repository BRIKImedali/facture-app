// CustomPermissionEvaluator.java — Évaluateur de permissions Spring Security
package com.pfe.facturation.security;

import com.pfe.facturation.security.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Évaluateur de permissions personnalisé pour Spring Security.
 * 
 * Permet d'utiliser l'annotation @PreAuthorize avec la syntaxe :
 * @PreAuthorize("hasPermission('FACTURE', 'CREATE')")
 * @PreAuthorize("hasPermission(null, 'SYSTEM:CONFIG')")
 * 
 * Spring Security appellera automatiquement les méthodes de cette classe
 * lorsque @PreAuthorize contient hasPermission(...).
 * 
 * Exemple : hasPermission('FACTURE', 'CREATE') → entity='FACTURE', permission='CREATE'
 * Le format final vérifié est : FACTURE:CREATE
 */
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private static final Logger log = LoggerFactory.getLogger(CustomPermissionEvaluator.class);

    /**
     * Vérifie si l'utilisateur connecté a la permission sur un objet/entité.
     *
     * @param authentication L'authentification Spring Security de l'utilisateur
     * @param targetDomainObject L'entité concernée (ex: "FACTURE") — peut être null
     * @param permission L'action (ex: "CREATE") ou la permission complète (ex: "FACTURE:CREATE")
     * @return true si l'utilisateur a la permission, false sinon
     */
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            log.debug("Permission refusée : utilisateur non authentifié");
            return false;
        }

        // Récupérer l'utilisateur depuis l'authentification
        if (!(authentication.getPrincipal() instanceof User user)) {
            log.debug("Permission refusée : principal n'est pas un User");
            return false;
        }

        // L'utilisateur avec le rôle système ADMIN a toutes les permissions
        if (com.pfe.facturation.security.entity.Role.ADMIN.equals(user.getRole())) {
            // Vérifier via appRoles si le rôle SUPER_ADMIN est assigné
            boolean isSuperAdmin = user.getAppRoles() != null &&
                user.getAppRoles().stream()
                    .anyMatch(r -> "SUPER_ADMIN".equals(r.getName()));
            if (isSuperAdmin) {
                log.debug("Permission accordée : utilisateur SUPER_ADMIN");
                return true;
            }
        }

        // Construire la chaîne de permission
        String permissionString = buildPermissionString(targetDomainObject, permission);

        // Vérifier si l'utilisateur a cette permission via ses rôles
        boolean hasPermission = user.hasPermission(permissionString);

        log.debug("Vérification permission '{}' pour '{}' : {}",
            permissionString, user.getEmail(), hasPermission ? "ACCORDÉE" : "REFUSÉE");

        return hasPermission;
    }

    /**
     * Vérifie la permission sur un objet identifié par son ID et type.
     * Utilisé pour les cas comme : hasPermission(#id, 'Facture', 'UPDATE')
     */
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId,
                                  String targetType, Object permission) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        if (!(authentication.getPrincipal() instanceof User user)) {
            return false;
        }

        String permissionString = buildPermissionString(targetType, permission);
        return user.hasPermission(permissionString);
    }

    /**
     * Construit la chaîne de permission au format ENTITY:ACTION.
     *
     * @param entity L'entité (ex: "FACTURE" ou null)
     * @param action L'action (ex: "CREATE" ou "FACTURE:CREATE")
     * @return La permission au format "FACTURE:CREATE"
     */
    private String buildPermissionString(Object entity, Object action) {
        if (action == null) return "";
        String actionStr = action.toString();

        // Si l'action contient déjà ":", c'est une permission complète (ex: "FACTURE:CREATE")
        if (actionStr.contains(":")) {
            return actionStr;
        }

        // Sinon, combiner entity + action
        if (entity != null && !entity.toString().isEmpty()) {
            return entity.toString().toUpperCase() + ":" + actionStr.toUpperCase();
        }

        return actionStr.toUpperCase();
    }
}
