package com.pfe.facturation.exception;

/**
 * Exception métier : lancée quand une ressource est introuvable en base.
 * Exemple : client avec id=5 n'existe pas → on lance cette exception.
 * Le GlobalExceptionHandler la convertit automatiquement en réponse HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    // Constructeur utilitaire : ResourceNotFoundException("Client", "id", 5)
    // → message : "Client non trouvé avec id : 5"
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s non trouvé avec %s : %s", resourceName, fieldName, fieldValue));
    }
}
