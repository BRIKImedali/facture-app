// DatabaseConfigController.java — Controller REST pour la gestion des profils BDD
package com.pfe.facturation.controller;

import com.pfe.facturation.model.DatabaseProfile;
import com.pfe.facturation.service.DatabaseConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la configuration dynamique de la base de données.
 * Accessible à : /api/admin/database/**
 *
 * Endpoints :
 * GET    /api/admin/database/profiles         → liste tous les profils
 * POST   /api/admin/database/profiles         → créer un profil
 * PUT    /api/admin/database/profiles/{id}    → modifier un profil
 * DELETE /api/admin/database/profiles/{id}    → supprimer un profil
 * POST   /api/admin/database/profiles/{id}/test     → tester la connexion
 * POST   /api/admin/database/profiles/{id}/activate → activer un profil
 */
@RestController
@RequestMapping("/api/admin/database")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class DatabaseConfigController {

    private final DatabaseConfigService databaseConfigService;

    /** Liste tous les profils de connexion */
    @GetMapping("/profiles")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<List<DatabaseProfile>> getAllProfiles() {
        List<DatabaseProfile> profiles = databaseConfigService.getAllProfiles();
        // Masquer les mots de passe dans la réponse
        profiles.forEach(p -> p.setPasswordEncrypted("****"));
        return ResponseEntity.ok(profiles);
    }

    /** Récupère un profil par son ID */
    @GetMapping("/profiles/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<DatabaseProfile> getProfileById(@PathVariable Long id) {
        DatabaseProfile profile = databaseConfigService.getProfileById(id);
        profile.setPasswordEncrypted("****"); // Masquer le mot de passe
        return ResponseEntity.ok(profile);
    }

    /**
     * Crée un nouveau profil de connexion BDD.
     * Le mot de passe dans le body est en clair, il sera chiffré en AES-256.
     */
    @PostMapping("/profiles")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> createProfile(
            @Valid @RequestBody DatabaseProfile profile,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            DatabaseProfile created = databaseConfigService.createProfile(profile, email);
            created.setPasswordEncrypted("****");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profil créé avec succès",
                "profile", created
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /** Met à jour un profil existant */
    @PutMapping("/profiles/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody DatabaseProfile profile) {
        try {
            DatabaseProfile updated = databaseConfigService.updateProfile(id, profile);
            updated.setPasswordEncrypted("****");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profil mis à jour avec succès",
                "profile", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /** Supprime un profil de connexion */
    @DeleteMapping("/profiles/{id}")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> deleteProfile(@PathVariable Long id) {
        try {
            databaseConfigService.deleteProfile(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Profil supprimé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Teste la connexion à une BDD sans l'activer.
     * Retourne le résultat du test avec la durée.
     */
    @PostMapping("/profiles/{id}/test")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable Long id) {
        var result = databaseConfigService.testConnection(id);
        return ResponseEntity.ok(Map.of(
            "success", result.isSuccess(),
            "message", result.getMessage(),
            "durationMs", result.durationMs() != null ? result.durationMs() : 0
        ));
    }

    /**
     * Teste la connexion avec des paramètres fournis directement
     * (avant même de sauvegarder le profil).
     */
    @PostMapping("/test-params")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> testConnectionWithParams(
            @RequestBody Map<String, Object> params) {
        try {
            var result = databaseConfigService.testConnectionWithParams(
                (String) params.get("dbType"),
                (String) params.get("host"),
                Integer.parseInt(params.get("port").toString()),
                (String) params.get("databaseName"),
                (String) params.get("username"),
                (String) params.get("password")
            );
            return ResponseEntity.ok(Map.of(
                "success", result.isSuccess(),
                "message", result.getMessage(),
                "durationMs", result.durationMs() != null ? result.durationMs() : 0
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Paramètres invalides : " + e.getMessage()
            ));
        }
    }

    /**
     * Active un profil de connexion.
     * Teste d'abord la connexion, puis désactive tous les autres profils.
     */
    @PostMapping("/profiles/{id}/activate")
    @PreAuthorize("hasPermission('SYSTEM', 'CONFIG')")
    public ResponseEntity<Map<String, Object>> activateProfile(@PathVariable Long id) {
        try {
            DatabaseProfile activated = databaseConfigService.activateProfile(id);
            activated.setPasswordEncrypted("****");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profil '" + activated.getProfileName() + "' activé avec succès",
                "profile", activated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
