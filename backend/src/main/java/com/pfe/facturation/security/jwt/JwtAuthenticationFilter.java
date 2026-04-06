package com.pfe.facturation.security.jwt;

import com.pfe.facturation.security.service.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import org.springframework.lang.NonNull;

/**
 * Filtre JWT — S'exécute une fois par requête HTTP entrante.
 *
 * Fonctionnement :
 * 1. La requête arrive (ex: GET /api/clients)
 * 2. Ce filtre lit le header "Authorization: Bearer <token>"
 * 3. Si le token est valide, il authentifie l'utilisateur dans Spring Security
 * 4. Si pas de token ou token invalide, la requête continue sans authentification
 *    (Spring Security bloquera ensuite si la route est protégée)
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Récupérer le header Authorization
        final String authHeader = request.getHeader("Authorization");

        // 2. Si pas de token Bearer → on laisse passer (sera bloqué si route protégée)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extraire le token (supprimer le préfixe "Bearer ")
        final String jwt = authHeader.substring(7);

        try {
            // 4. Extraire l'email du token
            final String userEmail = jwtUtil.extractEmail(jwt);

            // 5. Si email extrait et pas encore authentifié dans ce contexte
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 6. Charger l'utilisateur depuis la base de données
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                // 7. Valider le token
                if (jwtUtil.isTokenValid(jwt, userDetails)) {
                    // 8. Créer l'objet d'authentification Spring Security
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 9. Enregistrer l'authentification dans le contexte de la requête
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("User {} authenticated successfully", userEmail);
                }
            }
        } catch (Exception e) {
            log.warn("JWT processing failed for request {}: {}", request.getRequestURI(), e.getMessage());
        }

        // 10. Continuer vers le Controller
        filterChain.doFilter(request, response);
    }
}
