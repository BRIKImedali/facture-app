package com.pfe.facturation.security.config;

import com.pfe.facturation.security.jwt.JwtAuthenticationFilter;
import com.pfe.facturation.security.service.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuration principale de Spring Security.
 *
 * Points clés :
 * - JWT = Stateless (pas de session HTTP → STATELESS)
 * - CSRF désactivé (pas nécessaire avec JWT, et ça bloquerait les appels API)
 * - Routes publiques : /api/auth/** (login, register) et Swagger
 * - Toutes les autres routes nécessitent un token JWT valide
 * - BCrypt pour hasher les mots de passe (jamais en clair en base)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Permet d'utiliser @PreAuthorize("hasRole('ADMIN')") sur les méthodes
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          UserDetailsServiceImpl userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Définit les règles de sécurité pour chaque route HTTP.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 1. Désactiver CSRF (pas nécessaire avec JWT stateless)
            .csrf(AbstractHttpConfigurer::disable)

            // 2. Définir les autorisations par route
            .authorizeHttpRequests(auth -> auth
                // Routes publiques : tout le monde peut y accéder
                .requestMatchers("/api/auth/**").permitAll()
                // Swagger UI (pour la doc)
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                // Routes réservées aux admins
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                // Toutes les autres routes nécessitent d'être authentifié
                .anyRequest().authenticated()
            )

            // 3. Mode Stateless : pas de session HTTP côté serveur
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 4. Définir notre provider d'authentification personnalisé
            .authenticationProvider(authenticationProvider())

            // 5. Ajouter notre filtre JWT AVANT le filtre d'authentification standard
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Provider qui utilise notre UserDetailsService + BCrypt pour authentifier.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * BCryptPasswordEncoder : hash sécurisé des mots de passe.
     * Niveau 10 (force 10 = bon équilibre sécurité/performance)
     * JAMAIS stocker un mot de passe en clair !
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * AuthenticationManager : utilisé dans le AuthController pour authentifier.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
