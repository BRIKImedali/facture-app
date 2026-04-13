// ErpIntegrationService.java — Service pour la gestion des intégrations ERP
package com.pfe.facturation.service;

import com.pfe.facturation.aspect.Auditable;
import com.pfe.facturation.model.*;
import com.pfe.facturation.repository.*;
import com.pfe.facturation.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service pour la gestion des intégrations ERP.
 *
 * Fonctionnalités :
 * - CRUD des configurations ERP
 * - Test de connectivité API
 * - Synchronisation manuelle
 * - Gestion des mappings de champs
 * - Consultation de l'historique des syncs
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ErpIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(ErpIntegrationService.class);

    private final ErpConfigRepository erpConfigRepository;
    private final ErpSyncHistoryRepository syncHistoryRepository;
    private final EncryptionUtil encryptionUtil;

    /** Récupère toutes les configurations ERP */
    public List<ErpConfig> getAllConfigs() {
        return erpConfigRepository.findAll();
    }

    /** Récupère une configuration par son ID */
    public ErpConfig getConfigById(Long id) {
        return erpConfigRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Configuration ERP introuvable : " + id));
    }

    /**
     * Crée une nouvelle configuration ERP.
     * Les credentials (API Key, password) sont chiffrés avant stockage.
     */
    @Auditable(action = "CREATE", entity = "ErpConfig", description = "Création d'une configuration ERP")
    @Transactional
    public ErpConfig createConfig(ErpConfig config) {
        // Chiffrer les credentials
        if (config.getApiKeyEncrypted() != null && !config.getApiKeyEncrypted().isEmpty()) {
            config.setApiKeyEncrypted(encryptionUtil.encrypt(config.getApiKeyEncrypted()));
        }
        if (config.getPasswordEncrypted() != null && !config.getPasswordEncrypted().isEmpty()) {
            config.setPasswordEncrypted(encryptionUtil.encrypt(config.getPasswordEncrypted()));
        }

        log.info("Création configuration ERP type '{}'", config.getErpType());
        return erpConfigRepository.save(config);
    }

    /**
     * Met à jour une configuration ERP existante.
     */
    @Auditable(action = "UPDATE", entity = "ErpConfig", description = "Mise à jour d'une configuration ERP")
    @Transactional
    public ErpConfig updateConfig(Long id, ErpConfig updated) {
        ErpConfig existing = getConfigById(id);

        existing.setErpType(updated.getErpType());
        existing.setDisplayName(updated.getDisplayName());
        existing.setApiUrl(updated.getApiUrl());
        existing.setAuthType(updated.getAuthType());
        existing.setUsername(updated.getUsername());
        existing.setSyncIntervalMinutes(updated.getSyncIntervalMinutes());
        existing.setIsActive(updated.getIsActive());

        // Rechiffrer si de nouveaux credentials sont fournis
        if (updated.getApiKeyEncrypted() != null && !updated.getApiKeyEncrypted().isEmpty()) {
            existing.setApiKeyEncrypted(encryptionUtil.encrypt(updated.getApiKeyEncrypted()));
        }
        if (updated.getPasswordEncrypted() != null && !updated.getPasswordEncrypted().isEmpty()) {
            existing.setPasswordEncrypted(encryptionUtil.encrypt(updated.getPasswordEncrypted()));
        }

        log.info("Mise à jour configuration ERP '{}'", existing.getDisplayName());
        return erpConfigRepository.save(existing);
    }

    /**
     * Supprime une configuration ERP et tout son historique (cascade).
     */
    @Auditable(action = "DELETE", entity = "ErpConfig", description = "Suppression d'une configuration ERP")
    @Transactional
    public void deleteConfig(Long id) {
        ErpConfig config = getConfigById(id);
        log.info("Suppression configuration ERP '{}'", config.getDisplayName());
        erpConfigRepository.delete(config);
    }

    /**
     * Teste la connectivité vers l'API de l'ERP.
     * Effectue un GET sur l'URL configurée et vérifie le code HTTP de réponse.
     *
     * @param configId ID de la configuration à tester
     * @return Map avec 'success' (boolean) et 'message' (string)
     */
    public Map<String, Object> testConnection(Long configId) {
        ErpConfig config = getConfigById(configId);
        long startTime = System.currentTimeMillis();

        try {
            if (config.getApiUrl() == null || config.getApiUrl().isEmpty()) {
                return Map.of("success", false, "message", "URL API non configurée", "durationMs", 0L);
            }

            URL url = new URL(config.getApiUrl());
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            // Ajouter l'authentification selon le type
            if ("API_KEY".equals(config.getAuthType()) && config.getApiKeyEncrypted() != null) {
                String apiKey = encryptionUtil.decrypt(config.getApiKeyEncrypted());
                conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            } else if ("BASIC_AUTH".equals(config.getAuthType())) {
                String credentials = config.getUsername() + ":" +
                    encryptionUtil.decrypt(config.getPasswordEncrypted());
                String encoded = java.util.Base64.getEncoder()
                    .encodeToString(credentials.getBytes());
                conn.setRequestProperty("Authorization", "Basic " + encoded);
            }

            int responseCode = conn.getResponseCode();
            long duration = System.currentTimeMillis() - startTime;

            boolean success = responseCode >= 200 && responseCode < 400;
            String message = success
                ? "Connexion réussie (HTTP " + responseCode + ") en " + duration + "ms"
                : "Réponse HTTP " + responseCode + " en " + duration + "ms";

            log.info("Test connexion ERP '{}' : {} ({}ms)", config.getDisplayName(),
                success ? "SUCCÈS" : "ÉCHEC", duration);

            return Map.of("success", success, "message", message, "durationMs", duration,
                "httpStatus", responseCode);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Test connexion ERP '{}' : ÉCHEC - {}", config.getDisplayName(), e.getMessage());
            return Map.of("success", false, "message", "Erreur : " + e.getMessage(),
                "durationMs", duration);
        }
    }

    /**
     * Déclenche une synchronisation manuelle pour une configuration ERP.
     * Crée un enregistrement dans l'historique avec le statut SUCCESS ou FAILED.
     */
    @Auditable(action = "ERP_SYNC", entity = "ErpConfig", description = "Synchronisation manuelle ERP")
    @Transactional
    public ErpSyncHistory triggerManualSync(Long configId, String entityType) {
        ErpConfig config = getConfigById(configId);
        long startTime = System.currentTimeMillis();

        ErpSyncHistory history = ErpSyncHistory.builder()
            .erpConfig(config)
            .entityType(entityType)
            .syncDate(LocalDateTime.now())
            .status("IN_PROGRESS")
            .build();

        try {
            // Simulation de sync (à remplacer par la logique réelle selon l'ERP)
            log.info("Démarrage sync manuelle ERP '{}' pour entité '{}'",
                config.getDisplayName(), entityType);

            // TODO: Implémenter la logique de synchronisation réelle ici
            // selon config.getErpType() (ODOO, SAP, SAGE, etc.)
            Thread.sleep(500); // Simulation

            long duration = System.currentTimeMillis() - startTime;
            history.setStatus("SUCCESS");
            history.setRecordsImported(0);
            history.setRecordsExported(0);
            history.setDurationMs(duration);
            history.setInfoMessage("Synchronisation manuelle simulée");

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            history.setStatus("FAILED");
            history.setErrors(e.getMessage());
            history.setDurationMs(duration);
            log.error("Erreur lors de la sync ERP : {}", e.getMessage());
        }

        return syncHistoryRepository.save(history);
    }

    /**
     * Récupère l'historique des synchronisations avec pagination et filtres.
     */
    public Page<ErpSyncHistory> getSyncHistory(Long configId, String status,
                                                String entityType, int page, int size) {
        return syncHistoryRepository.findWithFilters(
            configId, status, entityType,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "syncDate"))
        );
    }

    /** Récupère la dernière sync réussie */
    public ErpSyncHistory getLastSuccessfulSync() {
        return syncHistoryRepository.findTopByStatusOrderBySyncDateDesc("SUCCESS")
            .orElse(null);
    }
}
