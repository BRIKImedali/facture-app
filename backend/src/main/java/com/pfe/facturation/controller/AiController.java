package com.pfe.facturation.controller;

import com.pfe.facturation.service.AiChatService;
import com.pfe.facturation.service.FactureValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour les fonctionnalités IA.
 * - Chat avec Gemini (assistant facturation)
 * - Validation métier intelligente d'une facture
 */
@RestController
@RequestMapping("/api/ai")
@Tag(name = "IA", description = "Assistant IA et validation de factures")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final AiChatService aiChatService;
    private final FactureValidationService validationService;

    public AiController(AiChatService aiChatService, FactureValidationService validationService) {
        this.aiChatService = aiChatService;
        this.validationService = validationService;
    }

    /**
     * POST /api/ai/chat
     * Envoie une question à l'assistant IA et retourne la réponse.
     *
     * Body : { "question": "Quelle est la TVA applicable ?" }
     */
    @PostMapping("/chat")
    @Operation(summary = "Chat avec l'assistant IA facturation (Gemini)")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String question = body.getOrDefault("question", "").trim();
        if (question.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "La question ne peut pas être vide."));
        }
        String reponse = aiChatService.chat(question);
        return ResponseEntity.ok(Map.of("reponse", reponse));
    }

    /**
     * POST /api/ai/valider-facture?id={id}
     * Valide une facture existante et retourne la liste des erreurs détectées.
     * Retourne une liste vide si la facture est valide.
     */
    @PostMapping("/valider-facture")
    @Operation(summary = "Valider une facture (taux TVA, cohérence math, champs obligatoires)")
    public ResponseEntity<List<FactureValidationService.ValidationError>> validerFacture(
            @RequestParam("id") Long id) {
        List<FactureValidationService.ValidationError> erreurs = validationService.valider(id);
        return ResponseEntity.ok(erreurs);
    }
}
