package com.pfe.facturation.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Structure standard de toutes les réponses d'erreur de l'API.
 * Le frontend recevra toujours ce format JSON en cas d'erreur.
 *
 * Exemple de réponse :
 * {
 *   "timestamp": "2024-03-23T14:00:00",
 *   "status": 404,
 *   "error": "Not Found",
 *   "message": "Client avec l'id 5 introuvable"
 * }
 */
@Data
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
}
