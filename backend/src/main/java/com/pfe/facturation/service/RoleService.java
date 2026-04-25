// RoleService.java — Service pour la gestion des rôles et permissions
package com.pfe.facturation.service;

import com.pfe.facturation.aspect.Auditable;
import com.pfe.facturation.model.AppRole;
import com.pfe.facturation.model.Permission;
import com.pfe.facturation.repository.AppRoleRepository;
import com.pfe.facturation.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service pour la gestion des rôles applicatifs et des permissions.
 * 
 * Fonctionnalités :
 * - CRUD des rôles (sauf rôles système)
 * - Assignation/révocation de permissions à un rôle
 * - Consultation de la matrice des permissions
 * - Initialisation des données par défaut
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);

    private final AppRoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    /** Récupère tous les rôles */
    public List<AppRole> getAllRoles() {
        return roleRepository.findAll();
    }

    /** Récupère un rôle par son ID */
    public AppRole getRoleById(Long id) {
        return roleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rôle introuvable : " + id));
    }

    /** Récupère un rôle par son nom */
    public AppRole getRoleByName(String name) {
        return roleRepository.findByName(name)
            .orElseThrow(() -> new RuntimeException("Rôle introuvable : " + name));
    }

    /** Récupère toutes les permissions disponibles */
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAllOrderedByEntityAndAction();
    }

    /**
     * Crée un nouveau rôle avec ses permissions initiales.
     */
    @Auditable(action = "CREATE", entity = "AppRole", description = "Création d'un rôle")
    @Transactional
    public AppRole createRole(AppRole role, Set<Long> permissionIds) {
        if (roleRepository.existsByName(role.getName())) {
            throw new RuntimeException("Un rôle avec le nom '" + role.getName() + "' existe déjà");
        }

        // Les rôles créés par l'admin ne sont jamais des rôles système
        role.setIsSystemRole(false);

        // Assigner les permissions sélectionnées
        if (permissionIds != null && !permissionIds.isEmpty()) {
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findAllById(permissionIds)
            );
            role.setPermissions(permissions);
        }

        log.info("Création du rôle '{}'", role.getName());
        return roleRepository.save(role);
    }

    /**
     * Met à jour un rôle existant.
     * Impossible de modifier les rôles système (SUPER_ADMIN).
     */
    @Auditable(action = "UPDATE", entity = "AppRole", description = "Mise à jour d'un rôle")
    @Transactional
    public AppRole updateRole(Long id, AppRole updatedRole, Set<Long> permissionIds) {
        AppRole existing = getRoleById(id);

        // Protection des rôles système
        if (Boolean.TRUE.equals(existing.getIsSystemRole())) {
            throw new RuntimeException("Le rôle SUPER_ADMIN est un rôle système et ne peut pas être modifié");
        }

        // Vérifier le nom unique
        if (!existing.getName().equals(updatedRole.getName()) &&
            roleRepository.existsByName(updatedRole.getName())) {
            throw new RuntimeException("Un rôle avec le nom '" + updatedRole.getName() + "' existe déjà");
        }

        existing.setName(updatedRole.getName());
        existing.setDescription(updatedRole.getDescription());

        // Mettre à jour les permissions
        if (permissionIds != null) {
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findAllById(permissionIds)
            );
            existing.setPermissions(permissions);
        }

        log.info("Mise à jour du rôle '{}'", existing.getName());
        return roleRepository.save(existing);
    }

    /**
     * Supprime un rôle.
     * Impossible de supprimer les rôles système.
     */
    @Auditable(action = "DELETE", entity = "AppRole", description = "Suppression d'un rôle")
    @Transactional
    public void deleteRole(Long id) {
        AppRole role = getRoleById(id);

        if (Boolean.TRUE.equals(role.getIsSystemRole())) {
            throw new RuntimeException("Impossible de supprimer un rôle système");
        }

        log.info("Suppression du rôle '{}'", role.getName());
        roleRepository.delete(role);
    }

    /**
     * Met à jour les permissions d'un rôle spécifique.
     */
    @Auditable(action = "ROLE_CHANGE", entity = "AppRole",
               description = "Modification des permissions d'un rôle")
    @Transactional
    public AppRole updateRolePermissions(Long roleId, Set<Long> permissionIds) {
        AppRole role = getRoleById(roleId);

        if (Boolean.TRUE.equals(role.getIsSystemRole())) {
            throw new RuntimeException("Impossible de modifier les permissions du rôle système SUPER_ADMIN");
        }

        Set<Permission> permissions = new HashSet<>(
            permissionRepository.findAllById(permissionIds)
        );
        role.setPermissions(permissions);

        log.info("Mise à jour des permissions du rôle '{}' : {} permissions", role.getName(), permissions.size());
        return roleRepository.save(role);
    }

    /**
     * Initialise les permissions et rôles par défaut au démarrage.
     * Appelé par AdminDataInitializer si les données n'existent pas.
     */
    @Transactional
    public void initDefaultData() {
        // Initialiser les permissions si elles n'existent pas
        initPermissions();
        // Initialiser les rôles par défaut
        initDefaultRoles();
    }

    /** Crée toutes les permissions par défaut */
    private void initPermissions() {
        String[][] perms = {
            {"FACTURE", "CREATE", "Créer des factures"},
            {"FACTURE", "READ", "Voir les factures"},
            {"FACTURE", "UPDATE", "Modifier des factures"},
            {"FACTURE", "DELETE", "Supprimer des factures"},
            {"FACTURE", "EXPORT", "Exporter des factures en PDF/Excel"},
            {"FACTURE", "APPROVE", "Approuver des factures"},
            {"CLIENT", "CREATE", "Créer des clients"},
            {"CLIENT", "READ", "Voir les clients"},
            {"CLIENT", "UPDATE", "Modifier des clients"},
            {"CLIENT", "DELETE", "Supprimer des clients"},
            {"PRODUIT", "CREATE", "Créer des produits"},
            {"PRODUIT", "READ", "Voir les produits"},
            {"PRODUIT", "UPDATE", "Modifier des produits"},
            {"PRODUIT", "DELETE", "Supprimer des produits"},
            {"USER", "CREATE", "Créer des utilisateurs"},
            {"USER", "READ", "Voir les utilisateurs"},
            {"USER", "UPDATE", "Modifier des utilisateurs"},
            {"USER", "DELETE", "Supprimer des utilisateurs"},
            {"ROLE", "CREATE", "Créer des rôles"},
            {"ROLE", "READ", "Voir les rôles"},
            {"ROLE", "UPDATE", "Modifier des rôles"},
            {"ROLE", "DELETE", "Supprimer des rôles"},
            {"UNITE", "CREATE", "Créer des unités"},
            {"UNITE", "READ", "Voir les unités"},
            {"UNITE", "UPDATE", "Modifier des unités"},
            {"UNITE", "DELETE", "Supprimer des unités"},
            {"CATEGORIE", "CREATE", "Créer des catégories"},
            {"CATEGORIE", "READ", "Voir les catégories"},
            {"CATEGORIE", "UPDATE", "Modifier des catégories"},
            {"CATEGORIE", "DELETE", "Supprimer des catégories"},
            {"SYSTEM", "CONFIG", "Configurer le système (admin)"},
            {"SYSTEM", "AUDIT", "Voir les logs d'audit"},
        };

        for (String[] perm : perms) {
            if (!permissionRepository.existsByEntityAndAction(perm[0], perm[1])) {
                permissionRepository.save(Permission.builder()
                    .entity(perm[0])
                    .action(perm[1])
                    .description(perm[2])
                    .build());
            }
        }
        log.info("Permissions par défaut initialisées");
    }

    /** Crée les rôles par défaut */
    private void initDefaultRoles() {
        List<Permission> allPerms = permissionRepository.findAll();

        // SUPER_ADMIN — toutes les permissions, non modifiable
        createDefaultRole("SUPER_ADMIN", "Super Administrateur — accès total", true,
            new HashSet<>(allPerms));

        // ADMIN — toutes les permissions
        createDefaultRole("ADMIN", "Administrateur — accès complet", true,
            new HashSet<>(allPerms));

        // MANAGER — CRUD factures, clients, produits
        Set<Permission> managerPerms = new HashSet<>(permissionRepository.findByEntity("FACTURE"));
        managerPerms.addAll(permissionRepository.findByEntity("CLIENT"));
        managerPerms.addAll(permissionRepository.findByEntity("PRODUIT"));
        createDefaultRole("MANAGER", "Manager — gestion des factures, clients et produits", true, managerPerms);

        // USER — READ + CREATE factures
        Set<Permission> userPerms = new HashSet<>();
        permissionRepository.findByAction("READ").forEach(userPerms::add);
        permissionRepository.findByEntityAndAction("FACTURE", "CREATE")
            .ifPresent(userPerms::add);
        createDefaultRole("USER", "Utilisateur standard — lecture + création de factures", true, userPerms);

        // VIEWER — lecture seule
        Set<Permission> viewerPerms = new HashSet<>(permissionRepository.findByAction("READ"));
        createDefaultRole("VIEWER", "Lecteur — accès en lecture seule", true, viewerPerms);

        log.info("Rôles par défaut initialisés");
    }

    private void createDefaultRole(String name, String desc, boolean isSystem, Set<Permission> perms) {
        if (!roleRepository.existsByName(name)) {
            roleRepository.save(AppRole.builder()
                .name(name)
                .description(desc)
                .isSystemRole(isSystem)
                .permissions(perms)
                .build());
            log.info("Rôle '{}' créé avec {} permissions", name, perms.size());
        }
    }
}
