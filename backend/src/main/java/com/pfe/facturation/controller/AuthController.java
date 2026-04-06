package com.pfe.facturation.controller;

import com.pfe.facturation.security.dto.AuthResponse;
import com.pfe.facturation.security.dto.LoginRequest;
import com.pfe.facturation.security.dto.RegisterRequest;
import com.pfe.facturation.security.entity.Role;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.jwt.JwtUtil;
import com.pfe.facturation.security.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller d'authentification.
 * Routes publiques (pas besoin de token JWT).
 *
 * POST /api/auth/register → Créer un compte
 * POST /api/auth/login    → Se connecter (retourne le token JWT)
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification", description = "Endpoints de connexion et inscription")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Inscription d'un nouvel utilisateur.
     * @Valid déclenche la validation du RegisterRequest automatiquement
     */
    @PostMapping("/register")
    @Operation(summary = "Créer un nouveau compte utilisateur")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {

        // 1. Vérifier que l'email n'est pas déjà utilisé
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Un compte avec cet email existe déjà : " + request.getEmail());
        }

        // 2. Créer le User (pattern Builder grâce à @Builder de Lombok)
        User user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // Hash BCrypt !
                .role(Role.USER) // Par défaut, tout nouvel utilisateur est USER
                .build();

        // 3. Sauvegarder en base de données
        userRepository.save(user);
        log.info("New user registered: {}", request.getEmail());

        // 4. Générer un token JWT et retourner la réponse
        String token = jwtUtil.generateToken(user);
        AuthResponse response = new AuthResponse(
                token,
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Connexion d'un utilisateur existant.
     * Si email/password incorrects → AuthenticationManager lève BadCredentialsException
     * → GlobalExceptionHandler la convertit en 401 Unauthorized automatiquement
     */
    @PostMapping("/login")
    @Operation(summary = "Se connecter et obtenir un token JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        // 1. Authentifier — Spring Security vérifie email + password hashé
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Récupérer l'utilisateur authentifié
        User user = (User) authentication.getPrincipal();
        log.info("User logged in: {}", user.getEmail());

        // 3. Générer le token JWT
        String token = jwtUtil.generateToken(user);
        AuthResponse response = new AuthResponse(
                token,
                user.getEmail(),
                user.getNom(),
                user.getPrenom(),
                user.getRole().name()
        );

        return ResponseEntity.ok(response);
    }
}
