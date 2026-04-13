// RoleController.java — Controller REST pour la gestion des rôles et permissions
package com.pfe.facturation.controller;

import com.pfe.facturation.model.AppRole;
import com.pfe.facturation.model.Permission;
import com.pfe.facturation.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Controller REST pour la gestion des rôles et permissions.
 * Accessible à : /api/admin/roles et /api/admin/permissions
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class RoleController {

    private final RoleService roleService;

    // ==================== PERMISSIONS ====================

    /** GET /api/admin/permissions — Liste toutes les permissions disponibles */
    @GetMapping("/permissions")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    // ==================== RÔLES ====================

    /** GET /api/admin/roles — Liste tous les rôles */
    @GetMapping("/roles")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<List<AppRole>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    /** GET /api/admin/roles/{id} — Récupère un rôle par son ID */
    @GetMapping("/roles/{id}")
    @PreAuthorize("hasPermission('ROLE', 'READ')")
    public ResponseEntity<AppRole> getRoleById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.getRoleById(id));
    }

    /**
     * POST /api/admin/roles — Crée un nouveau rôle.
     * Body : { name, description, permissionIds: [1, 2, 3] }
     */
    @PostMapping("/roles")
    @PreAuthorize("hasPermission('ROLE', 'CREATE')")
    public ResponseEntity<Map<String, Object>> createRole(@Valid @RequestBody Map<String, Object> body) {
        try {
            AppRole role = new AppRole();
            role.setName((String) body.get("name"));
            role.setDescription((String) body.get("description"));

            @SuppressWarnings("unchecked")
            List<Integer> ids = (List<Integer>) body.getOrDefault("permissionIds", List.of());
            Set<Long> permissionIds = new java.util.HashSet<>();
            ids.forEach(id -> permissionIds.add(Long.valueOf(id)));

            AppRole created = roleService.createRole(role, permissionIds);
            return ResponseEntity.ok(Map.of("success", true, "message", "Rôle créé", "role", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/roles/{id} — Met à jour un rôle.
     */
    @PutMapping("/roles/{id}")
    @PreAuthorize("hasPermission('ROLE', 'UPDATE')")
    public ResponseEntity<Map<String, Object>> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            AppRole role = new AppRole();
            role.setName((String) body.get("name"));
            role.setDescription((String) body.get("description"));

            @SuppressWarnings("unchecked")
            List<Integer> ids = (List<Integer>) body.getOrDefault("permissionIds", List.of());
            Set<Long> permissionIds = new java.util.HashSet<>();
            ids.forEach(rid -> permissionIds.add(Long.valueOf(rid)));

            AppRole updated = roleService.updateRole(id, role, permissionIds);
            return ResponseEntity.ok(Map.of("success", true, "message", "Rôle mis à jour", "role", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** DELETE /api/admin/roles/{id} — Supprime un rôle */
    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasPermission('ROLE', 'DELETE')")
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable Long id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Rôle supprimé"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/roles/{id}/permissions — Met à jour les permissions d'un rôle.
     * Body : { permissionIds: [1, 2, 3] }
     */
    @PostMapping("/roles/{id}/permissions")
    @PreAuthorize("hasPermission('ROLE', 'UPDATE')")
    public ResponseEntity<Map<String, Object>> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> ids = (List<Integer>) body.getOrDefault("permissionIds", List.of());
            Set<Long> permissionIds = new java.util.HashSet<>();
            ids.forEach(pid -> permissionIds.add(Long.valueOf(pid)));

            AppRole updated = roleService.updateRolePermissions(id, permissionIds);
            return ResponseEntity.ok(Map.of("success", true, "message", "Permissions mises à jour", "role", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
