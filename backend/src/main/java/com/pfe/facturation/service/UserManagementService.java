// UserManagementService.java — Service pour la gestion des utilisateurs (module admin)
package com.pfe.facturation.service;

import com.pfe.facturation.aspect.Auditable;
import com.pfe.facturation.model.AppRole;
import com.pfe.facturation.repository.AppRoleRepository;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.entity.Role;
import com.pfe.facturation.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Service pour la gestion des utilisateurs dans le module d'administration.
 *
 * Fonctionnalités :
 * - Lister / filtrer les utilisateurs
 * - Activer / désactiver un compte
 * - Assigner des rôles applicatifs à un utilisateur
 * - Réinitialiser le mot de passe
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserManagementService {

    private static final Logger log = LoggerFactory.getLogger(UserManagementService.class);

    private final UserRepository userRepository;
    private final AppRoleRepository appRoleRepository;
    private final PasswordEncoder passwordEncoder;

    /** Liste tous les utilisateurs avec pagination */
    public Page<User> getAllUsers(int page, int size, String sortBy) {
        return userRepository.findAll(
            PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, sortBy))
        );
    }

    /** Recherche d'utilisateurs par email, nom ou prénom */
    public List<User> searchUsers(String query) {
        // Utilise la méthode correcte définie dans UserRepository
        return userRepository.searchByUsernameOrName(query);
    }

    /**
     * Crée un nouvel utilisateur depuis l'interface d'administration.
     *
     * @param username Identifiant de connexion unique
     * @param password Mot de passe en clair (sera hashé avec BCrypt)
     * @param nom      Nom de famille
     * @param prenom   Prénom
     * @param role     Rôle système : "ADMIN", "USER", "COMPTABLE"...
     */
    @Auditable(action = "CREATE", entity = "User", description = "Création d'un nouvel utilisateur")
    @Transactional
    public User createUser(String username, String password, Set<Long> roleIds, String nom, String prenom) {
        // Vérifier que le username n'est pas déjà utilisé
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Un utilisateur avec cet identifiant existe déjà : " + username);
        }
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 8 caractères");
        }

        // Récupérer les rôles applicatifs
        List<AppRole> roles = (roleIds == null || roleIds.isEmpty())
            ? new ArrayList<>()
            : appRoleRepository.findAllByIdIn(roleIds);

        User newUser = User.builder()
            .username(username)
            .password(passwordEncoder.encode(password))
            .nom(nom)
            .prenom(prenom)
            .role(Role.USER) // Valeur par défaut pour compatibilité
            .appRoles(roles)
            .isActive(true)
            .build();

        log.info("Création d'un nouvel utilisateur : '{}' avec {} rôle(s)", username, roles.size());
        return userRepository.save(newUser);
    }

    /** Récupère un utilisateur par son ID */
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + id));
    }

    /**
     * Active ou désactive un compte utilisateur.
     * Un utilisateur désactivé ne peut plus se connecter (isEnabled() = false).
     */
    @Auditable(action = "UPDATE", entity = "User", description = "Activation/désactivation d'un utilisateur")
    @Transactional
    public User toggleUserStatus(Long id) {
        User user = getUserById(id);
        boolean newStatus = !Boolean.TRUE.equals(user.getIsActive());
        user.setIsActive(newStatus);

        log.info("Compte utilisateur '{}' : {}", user.getUsername(),
            newStatus ? "ACTIVÉ" : "DÉSACTIVÉ");
        return userRepository.save(user);
    }

    /**
     * Assigne un ensemble de rôles applicatifs à un utilisateur.
     * Remplace les rôles existants.
     *
     * @param userId ID de l'utilisateur
     * @param roleIds IDs des rôles à assigner
     */
    @Auditable(action = "ROLE_CHANGE", entity = "User", description = "Assignation de rôles à un utilisateur")
    @Transactional
    public User assignRoles(Long userId, Set<Long> roleIds) {
        User user = getUserById(userId);

        // Récupérer les rôles depuis la BDD
        List<AppRole> roles = roleIds.isEmpty()
            ? new ArrayList<>()
            : appRoleRepository.findAllByIdIn(roleIds);

        user.setAppRoles(roles);

        log.info("Assignation de {} rôle(s) à l'utilisateur '{}'", roles.size(), user.getUsername());
        return userRepository.save(user);
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur.
     * Le nouveau mot de passe est hashé avec BCrypt.
     *
     * @param userId ID de l'utilisateur
     * @param newPassword Nouveau mot de passe en clair
     */
    @Auditable(action = "PASSWORD_RESET", entity = "User", description = "Réinitialisation du mot de passe")
    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("Le mot de passe doit contenir au moins 8 caractères");
        }

        User user = getUserById(userId);
        user.setPassword(passwordEncoder.encode(newPassword));

        log.info("Mot de passe réinitialisé pour l'utilisateur '{}'", user.getUsername());
        userRepository.save(user);
    }

    /**
     * Met à jour les informations d'un utilisateur (nom, prénom).
     * L'identifiant (username) ne peut pas être modifié.
     */
    @Auditable(action = "UPDATE", entity = "User", description = "Modification d'un utilisateur")
    @Transactional
    public User updateUser(Long id, String nom, String prenom) {
        User user = getUserById(id);
        user.setNom(nom);
        user.setPrenom(prenom);
        log.info("Mise à jour de l'utilisateur '{}'", user.getUsername());
        return userRepository.save(user);
    }

    /** Compte total des utilisateurs actifs */
    public long countActiveUsers() {
        return userRepository.countByIsActiveTrue();
    }
}
