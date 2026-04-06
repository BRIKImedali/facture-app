package com.pfe.facturation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Service d'intégration avec l'API Gemini de Google.
 * Utilise RestClient (Spring 6) pour faire des appels HTTP natifs.
 *
 * Configuration requise dans application.properties :
 *   gemini.api.key=YOUR_API_KEY
 *   gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
 */
@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    /** System prompt caché — restreint l'assistant aux sujets de facturation */
    private static final String SYSTEM_PROMPT =
            "Tu es un assistant de facturation expert pour PME françaises. " +
            "Réponds UNIQUEMENT aux sujets suivants : factures, devis, TVA, clients, comptabilité, " +
            "paiements, délais de paiement, numérotation de factures. " +
            "Si la question est hors sujet, réponds poliment que tu ne peux pas aider sur ce sujet. " +
            "Tes réponses doivent être concises, professionnelles et en français.";

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String apiUrl;

    private final RestClient restClient;

    public AiChatService() {
        this.restClient = RestClient.create();
    }

    /**
     * Envoie une question à Gemini et retourne la réponse texte.
     *
     * @param question question de l'utilisateur
     * @return réponse de Gemini, ou message d'erreur si non configuré
     */
    public String chat(String question) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Clé API Gemini non configurée. Définir la variable d'environnement GEMINI_API_KEY.");
            return "⚙️ L'assistant IA n'est pas configuré. " +
                   "Veuillez définir la variable d'environnement GEMINI_API_KEY dans application.properties.";
        }

        try {
            // Construction du payload Gemini
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", SYSTEM_PROMPT + "\n\nQuestion : " + question)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "maxOutputTokens", 1024,
                            "temperature", 0.3
                    )
            );

            // Appel HTTP vers l'API Gemini
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            // Extraction du texte de la réponse
            return extractText(response);

        } catch (Exception e) {
            log.error("Erreur lors de l'appel à l'API Gemini", e);
            return "❌ Erreur lors de la communication avec l'assistant IA : " + e.getMessage();
        }
    }

    /**
     * Extrait le texte de la réponse JSON de Gemini.
     * Structure : candidates[0].content.parts[0].text
     */
    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        if (response == null) return "Aucune réponse reçue.";
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "Réponse vide de l'assistant.";

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.error("Impossible d'extraire le texte de la réponse Gemini", e);
            return "Réponse dans un format inattendu.";
        }
    }
}
