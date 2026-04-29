package com.pfe.facturation.controller;

import com.pfe.facturation.security.dto.AuthResponse;
import com.pfe.facturation.security.dto.LoginRequest;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.jwt.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller d'authentification.
 * Routes publiques (pas besoin de token JWT).
 *
 * Changement v2: 
 * - L'inscription publique est désactivée. Seuls les administrateurs 
 *   peuvent créer des utilisateurs via UserManagementController.
 * - La connexion se fait via l'identifiant (username) au lieu de l'email.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification", description = "Endpoints de connexion")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Connexion d'un utilisateur via son identifiant (username) et mot de passe.
     */
    @PostMapping("/login")
    @Operation(summary = "Se connecter et obtenir un token JWT via l'identifiant")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        // 1. Authentifier — Spring Security vérifie username + password hashé
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 2. Récupérer l'utilisateur authentifié
        User user = (User) authentication.getPrincipal();
        log.info("User logged in: {}", user.getUsername());

        // 3. Générer le token JWT
        String token = jwtUtil.generateToken(user);
        AuthResponse response = new AuthResponse(
                token,
                user.getUsername(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name(),
                user.getAllPermissions()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Récupère les informations de l'utilisateur connecté
     */
    @GetMapping("/me")
    @Operation(summary = "Récupérer les informations de l'utilisateur connecté")
    public ResponseEntity<AuthResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }

        User user = (User) authentication.getPrincipal();
        AuthResponse response = new AuthResponse(
                "", // token
                user.getUsername(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name(),
                user.getAllPermissions()
        );

        return ResponseEntity.ok(response);
    }
}
