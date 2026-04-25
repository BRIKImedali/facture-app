package com.pfe.facturation.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Utilitaire JWT — Responsable de la création et validation des tokens.
 *
 * Le fonctionnement JWT en résumé :
 * 1. L'utilisateur se connecte (email + password)
 * 2. Le serveur génère un token signé avec une clé secrète
 * 3. Le client stocke ce token et l'envoie dans chaque requête (header Authorization)
 * 4. Le serveur vérifie la signature du token pour authentifier l'utilisateur
 *
 * @Component → Spring gère cette classe comme un bean injectable
 */
@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationMs; // En millisecondes (86400000 = 24 heures)

    /**
     * Construit la clé de signature à partir de la clé secrète en Base64.
     * La clé doit faire au moins 256 bits pour l'algorithme HS256.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Génère un token JWT pour un utilisateur connecté.
     * Le token contient : l'email (subject) + date d'expiration + signature
     */
    public String generateToken(UserDetails userDetails) {
        var builder = Jwts.builder()
                .subject(userDetails.getUsername()) // username
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey());
                
        if (userDetails instanceof com.pfe.facturation.security.entity.User) {
            com.pfe.facturation.security.entity.User user = (com.pfe.facturation.security.entity.User) userDetails;
            builder.claim("permissions", user.getAllPermissions());
        }
        
        return builder.compact();
    }

    /**
     * Extrait le username (subject) du token JWT.
     */
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Vérifie si le token est valide pour cet utilisateur.
     * Conditions : email correspond + token non expiré
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    /**
     * Extrait toutes les "claims" (informations) du token.
     * Lance une exception si le token est invalide ou falsifié.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
