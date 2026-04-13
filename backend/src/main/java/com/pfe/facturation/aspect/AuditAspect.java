// AuditAspect.java — Aspect AOP pour l'audit automatique des actions
package com.pfe.facturation.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pfe.facturation.model.AuditLog;
import com.pfe.facturation.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Aspect AOP qui intercepte les méthodes annotées avec @Auditable.
 * 
 * Fonctionnement :
 * 1. Intercèpte l'appel de la méthode annotée
 * 2. Récupère l'utilisateur connecté depuis Spring Security
 * 3. Capture l'adresse IP du client
 * 4. Exécute la méthode originale
 * 5. Enregistre le log d'audit avec le résultat
 * 
 * En cas d'exception, l'audit est enregistré avec le statut d'erreur.
 */
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Point de coupe : intercepte toutes les méthodes annotées @Auditable.
     * @Around permet d'exécuter du code avant ET après la méthode.
     */
    @Around("@annotation(auditable)")
    public Object auditMethod(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        // Récupérer les informations de l'utilisateur connecté
        String userEmail = getCurrentUserEmail();
        Long userId = getCurrentUserId();
        String ipAddress = getClientIpAddress();

        Object result = null;
        String errorMessage = null;

        try {
            // Exécuter la méthode originale
            result = joinPoint.proceed();
            return result;
        } catch (Throwable throwable) {
            // Capturer l'erreur pour l'inclure dans le log
            errorMessage = throwable.getMessage();
            throw throwable;
        } finally {
            // Enregistrer le log d'audit dans tous les cas (succès ou erreur)
            try {
                String newValueJson = null;
                if (result != null) {
                    try {
                        newValueJson = objectMapper.writeValueAsString(result);
                        // Limiter la taille du JSON pour éviter les logs trop volumineux
                        if (newValueJson != null && newValueJson.length() > 5000) {
                            newValueJson = newValueJson.substring(0, 5000) + "...[TRONQUÉ]";
                        }
                    } catch (Exception e) {
                        newValueJson = "Erreur sérialisation: " + e.getMessage();
                    }
                }

                String description = auditable.description().isEmpty()
                    ? auditable.action() + " sur " + auditable.entity()
                    : auditable.description();

                if (errorMessage != null) {
                    description += " [ERREUR: " + errorMessage + "]";
                }

                AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .actionType(auditable.action())
                    .entityType(auditable.entity())
                    .newValue(newValueJson)
                    .ipAddress(ipAddress)
                    .description(description)
                    .build();

                auditLogRepository.save(auditLog);
            } catch (Exception e) {
                // Ne jamais faire échouer la méthode originale à cause de l'audit
                log.error("Erreur lors de l'enregistrement du log d'audit : {}", e.getMessage());
            }
        }
    }

    /**
     * Récupère l'email de l'utilisateur actuellement connecté.
     */
    private String getCurrentUserEmail() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return auth.getName();
            }
        } catch (Exception e) {
            log.warn("Impossible de récupérer l'email de l'utilisateur : {}", e.getMessage());
        }
        return "SYSTEM";
    }

    /**
     * Récupère l'ID de l'utilisateur connecté depuis le principal.
     */
    private Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof com.pfe.facturation.security.entity.User user) {
                return user.getId();
            }
        } catch (Exception e) {
            log.warn("Impossible de récupérer l'ID de l'utilisateur : {}", e.getMessage());
        }
        return null;
    }

    /**
     * Récupère l'adresse IP réelle du client.
     * Gère les cas de reverse proxy (X-Forwarded-For, X-Real-IP).
     */
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                // Vérifier les headers de proxy
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                String xRealIp = request.getHeader("X-Real-IP");
                if (xRealIp != null && !xRealIp.isEmpty()) {
                    return xRealIp;
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.warn("Impossible de récupérer l'adresse IP : {}", e.getMessage());
        }
        return "UNKNOWN";
    }
}
