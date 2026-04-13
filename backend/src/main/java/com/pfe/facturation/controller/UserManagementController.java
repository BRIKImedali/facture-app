// UserManagementController.java — Controller REST pour la gestion des utilisateurs
package com.pfe.facturation.controller;

import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Controller REST pour la gestion des utilisateurs (module admin).
 * Accessible à : /api/admin/users/**
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UserManagementController {

    private final UserManagementService userManagementService;

    /** GET /api/admin/users — Liste paginée des utilisateurs */
    @GetMapping
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "email") String sortBy) {
        Page<User> usersPage = userManagementService.getAllUsers(page, size, sortBy);
        return ResponseEntity.ok(Map.of(
            "users", usersPage.getContent().stream().map(this::sanitizeUser).toList(),
            "totalElements", usersPage.getTotalElements(),
            "totalPages", usersPage.getTotalPages(),
            "currentPage", page
        ));
    }

    /** GET /api/admin/users/search?q=query — Recherche d'utilisateurs */
    @GetMapping("/search")
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam String q) {
        List<User> users = userManagementService.searchUsers(q);
        return ResponseEntity.ok(users.stream().map(this::sanitizeUser).toList());
    }

    /** GET /api/admin/users/{id} — Détail d'un utilisateur */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'READ')")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        User user = userManagementService.getUserById(id);
        return ResponseEntity.ok(sanitizeUser(user));
    }

    /** PUT /api/admin/users/{id} — Mise à jour des informations d'un utilisateur */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('USER', 'UPDATE')")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            User updated = userManagementService.updateUser(
                id, body.get("nom"), body.get("prenom")
            );
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Utilisateur mis à jour",
                "user", sanitizeUser(updated)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/users/{id}/roles — Assigne des rôles à un utilisateur.
     * Body : { roleIds: [1, 2] }
     */
    @PostMapping("/{id}/roles")
    @PreAuthorize("hasPermission('USER', 'UPDATE')")
    public ResponseEntity<Map<String, Object>> assignRoles(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> ids = (List<Integer>) body.getOrDefault("roleIds", List.of());
            Set<Long> roleIds = new java.util.HashSet<>();
            ids.forEach(rid -> roleIds.add(Long.valueOf(rid)));

            User updated = userManagementService.assignRoles(id, roleIds);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Rôles assignés avec succès",
                "user", sanitizeUser(updated)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/users/{id}/toggle-status — Active/désactive un compte.
     */
    @PostMapping("/{id}/toggle-status")
    @PreAuthorize("hasPermission('USER', 'UPDATE')")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(@PathVariable Long id) {
        try {
            User updated = userManagementService.toggleUserStatus(id);
            String statusMsg = Boolean.TRUE.equals(updated.getIsActive()) ? "activé" : "désactivé";
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Compte utilisateur " + statusMsg,
                "isActive", updated.getIsActive()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/users/{id}/reset-password — Réinitialise le mot de passe.
     * Body : { newPassword: "..." }
     */
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasPermission('USER', 'UPDATE')")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            userManagementService.resetPassword(id, body.get("newPassword"));
            return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe réinitialisé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Nettoie l'objet User pour la réponse JSON :
     * - Supprime le mot de passe hashé
     * - Ajoute les permissions de l'utilisateur
     */
    private Map<String, Object> sanitizeUser(User user) {
        return Map.of(
            "id", user.getId(),
            "nom", user.getNom() != null ? user.getNom() : "",
            "prenom", user.getPrenom() != null ? user.getPrenom() : "",
            "email", user.getEmail(),
            "role", user.getRole().name(),
            "isActive", user.getIsActive() != null ? user.getIsActive() : true,
            "appRoles", user.getAppRoles() != null
                ? user.getAppRoles().stream().map(r -> Map.of(
                    "id", r.getId(), "name", r.getName())).toList()
                : List.of(),
            "permissions", user.getAllPermissions(),
            "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
        );
    }
}
