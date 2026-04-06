package com.pfe.facturation.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Structure standard de toutes les réponses d'erreur de l'API.
 * Le frontend recevra toujours ce format JSON en cas d'erreur.
 *

 */
@Data
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
}
