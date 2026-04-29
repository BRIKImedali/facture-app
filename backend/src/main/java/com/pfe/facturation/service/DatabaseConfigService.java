// DatabaseConfigService.java — Service pour la gestion des profils de connexion BDD
package com.pfe.facturation.service;

import com.pfe.facturation.aspect.Auditable;
import com.pfe.facturation.model.DatabaseProfile;
import com.pfe.facturation.repository.DatabaseProfileRepository;
import com.pfe.facturation.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.List;
import java.util.Optional;

/**
 * Service pour la gestion dynamique des profils de connexion à la base de données.
 * 
 * Fonctionnalités :
 * - CRUD des profils de connexion
 * - Test de connexion avant application
 * - Chiffrement/déchiffrement AES-256 des mots de passe
 * - Activation/désactivation de profils
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DatabaseConfigService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfigService.class);

    private final DatabaseProfileRepository profileRepository;
    private final EncryptionUtil encryptionUtil;
    private final DatabaseProvisioningService provisioningService;

    /** Récupère tous les profils de connexion */
    public List<DatabaseProfile> getAllProfiles() {
        return profileRepository.findAll();
    }

    /** Récupère un profil par son ID */
    public DatabaseProfile getProfileById(Long id) {
        return profileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Profil introuvable : " + id));
    }

    /** Récupère le profil actuellement actif */
    public Optional<DatabaseProfile> getActiveProfile() {
        return profileRepository.findByIsActiveTrue();
    }

    /**
     * Crée un nouveau profil de connexion.
     * Le mot de passe est chiffré avant stockage.
     *
     * @param profile Le profil à créer (avec mot de passe en clair)
     * @param createdByEmail Email de l'admin créateur
     * @return Le profil créé avec mot de passe chiffré
     */
    @Auditable(action = "CREATE", entity = "DatabaseProfile",
               description = "Création d'un profil de connexion BDD")
    @Transactional
    public DatabaseProfile createProfile(DatabaseProfile profile, String createdByEmail) {
        // Vérifier que le nom n'existe pas déjà
        if (profileRepository.existsByProfileName(profile.getProfileName())) {
            throw new RuntimeException("Un profil avec le nom '" + profile.getProfileName() + "' existe déjà");
        }

        // Chiffrer le mot de passe avant stockage
        if (profile.getPasswordEncrypted() != null && !profile.getPasswordEncrypted().isEmpty()) {
            profile.setPasswordEncrypted(encryptionUtil.encrypt(profile.getPasswordEncrypted()));
        }

        profile.setCreatedBy(createdByEmail);

        // Si c'est le premier profil, le définir comme défaut
        if (profileRepository.count() == 0) {
            profile.setIsDefault(true);
        }

        log.info("Création du profil BDD '{}' par {}", profile.getProfileName(), createdByEmail);
        DatabaseProfile saved = profileRepository.save(profile);

        // Provisionner automatiquement la nouvelle base de données et créer toutes les tables
        try {
            String result = provisioningService.provisionDatabase(saved);
            log.info("Provisionnement : {}", result);
        } catch (Exception e) {
            log.warn("Provisionnement impossible pour '{}' : {} — la BDD devra être créée manuellement.",
                    profile.getProfileName(), e.getMessage());
        }

        return saved;
    }

    /**
     * Met à jour un profil existant.
     * Si le mot de passe est fourni en clair (non chiffré), il est rechiffré.
     */
    @Auditable(action = "UPDATE", entity = "DatabaseProfile",
               description = "Mise à jour d'un profil de connexion BDD")
    @Transactional
    public DatabaseProfile updateProfile(Long id, DatabaseProfile updatedProfile) {
        DatabaseProfile existing = getProfileById(id);

        // Vérifier le nom unique (sauf pour le même profil)
        if (!existing.getProfileName().equals(updatedProfile.getProfileName()) &&
            profileRepository.existsByProfileName(updatedProfile.getProfileName())) {
            throw new RuntimeException("Un profil avec le nom '" + updatedProfile.getProfileName() + "' existe déjà");
        }

        existing.setProfileName(updatedProfile.getProfileName());
        existing.setDbType(updatedProfile.getDbType());
        existing.setHost(updatedProfile.getHost());
        existing.setPort(updatedProfile.getPort());
        existing.setDatabaseName(updatedProfile.getDatabaseName());
        existing.setUsername(updatedProfile.getUsername());

        // Rechiffrer si un nouveau mot de passe est fourni
        if (updatedProfile.getPasswordEncrypted() != null &&
            !updatedProfile.getPasswordEncrypted().isEmpty()) {
            existing.setPasswordEncrypted(encryptionUtil.encrypt(updatedProfile.getPasswordEncrypted()));
        }

        log.info("Mise à jour du profil BDD '{}'", existing.getProfileName());
        return profileRepository.save(existing);
    }

    /**
     * Supprime un profil de connexion.
     * Impossible de supprimer le profil actif.
     */
    @Auditable(action = "DELETE", entity = "DatabaseProfile",
               description = "Suppression d'un profil de connexion BDD")
    @Transactional
    public void deleteProfile(Long id) {
        DatabaseProfile profile = getProfileById(id);

        if (Boolean.TRUE.equals(profile.getIsActive())) {
            throw new RuntimeException("Impossible de supprimer le profil actif. Activez d'abord un autre profil.");
        }

        log.info("Suppression du profil BDD '{}'", profile.getProfileName());
        profileRepository.delete(profile);
    }

    /**
     * Active un profil de connexion.
     * Désactive automatiquement tous les autres profils.
     */
    @Auditable(action = "CONFIG_CHANGE", entity = "DatabaseProfile",
               description = "Activation d'un profil de connexion BDD")
    @Transactional
    public DatabaseProfile activateProfile(Long id) {
        DatabaseProfile profile = getProfileById(id);

        // Tester la connexion avant d'activer
        TestConnectionResult testResult = testConnection(id);
        if (!testResult.isSuccess()) {
            throw new RuntimeException("Impossible d'activer le profil : " + testResult.getMessage());
        }

        // Désactiver tous les autres profils
        profileRepository.deactivateAllProfiles();

        // Activer le profil sélectionné
        profile.setIsActive(true);

        log.info("Activation du profil BDD '{}'", profile.getProfileName());
        DatabaseProfile activated = profileRepository.save(profile);

        // Provisionner si la BDD n'existe pas encore
        try {
            provisioningService.provisionDatabase(activated);
        } catch (Exception e) {
            log.warn("Provisionnement lors de l'activation ignoré : {}", e.getMessage());
        }

        // Mettre à jour application.properties → app pointera sur cette BDD au prochain démarrage
        provisioningService.updateApplicationProperties(activated);
        log.info("application.properties mis à jour. Redémarrez l'application pour appliquer le changement.");

        return activated;
    }

    /**
     * Teste la connexion à une base de données sans l'activer.
     * Crée une connexion JDBC temporaire et la ferme immédiatement.
     *
     * @param profileId ID du profil à tester
     * @return Résultat du test (succès/échec + message)
     */
    public TestConnectionResult testConnection(Long profileId) {
        DatabaseProfile profile = getProfileById(profileId);
        return testConnectionWithProfile(profile);
    }

    /**
     * Teste la connexion avec les paramètres fournis directement
     * (pour tester avant sauvegarde).
     */
    public TestConnectionResult testConnectionWithParams(String dbType, String host,
                                                          Integer port, String databaseName,
                                                          String username, String password) {
        DatabaseProfile tempProfile = DatabaseProfile.builder()
            .dbType(dbType).host(host).port(port)
            .databaseName(databaseName).username(username)
            .passwordEncrypted(encryptionUtil.encrypt(password))
            .build();
        return testConnectionWithProfile(tempProfile);
    }

    /**
     * Logique interne de test de connexion JDBC.
     */
    private TestConnectionResult testConnectionWithProfile(DatabaseProfile profile) {
        long startTime = System.currentTimeMillis();
        try {
            String jdbcUrl = buildJdbcUrl(profile);
            String password = encryptionUtil.decrypt(profile.getPasswordEncrypted());

            // Charger le driver JDBC approprié
            loadJdbcDriver(profile.getDbType());

            // Tenter la connexion avec un timeout de 5 secondes
            try (Connection conn = DriverManager.getConnection(jdbcUrl, profile.getUsername(), password)) {
                long duration = System.currentTimeMillis() - startTime;
                boolean valid = conn.isValid(5);
                if (valid) {
                    log.info("Test connexion BDD '{}' : SUCCÈS en {}ms", profile.getProfileName(), duration);
                    return new TestConnectionResult(true,
                        "Connexion réussie en " + duration + "ms", duration);
                } else {
                    return new TestConnectionResult(false, "La connexion n'est pas valide", duration);
                }
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Test connexion BDD '{}' : ÉCHEC - {}", profile.getProfileName(), e.getMessage());
            return new TestConnectionResult(false, "Échec de connexion : " + e.getMessage(), duration);
        }
    }

    /**
     * Construit l'URL JDBC selon le type de BDD.
     */
    private String buildJdbcUrl(DatabaseProfile profile) {
        return switch (profile.getDbType().toUpperCase()) {
            case "POSTGRESQL" -> String.format("jdbc:postgresql://%s:%d/%s",
                profile.getHost(), profile.getPort(), profile.getDatabaseName());
            case "MYSQL" -> String.format("jdbc:mysql://%s:%d/%s?useSSL=false&allowPublicKeyRetrieval=true",
                profile.getHost(), profile.getPort(), profile.getDatabaseName());
            case "ORACLE" -> String.format("jdbc:oracle:thin:@%s:%d:%s",
                profile.getHost(), profile.getPort(), profile.getDatabaseName());
            case "SQLSERVER" -> String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=true;trustServerCertificate=true",
                profile.getHost(), profile.getPort(), profile.getDatabaseName());
            default -> throw new RuntimeException("Type de BDD non supporté : " + profile.getDbType());
        };
    }

    /**
     * Charge le driver JDBC selon le type de BDD.
     */
    private void loadJdbcDriver(String dbType) throws ClassNotFoundException {
        switch (dbType.toUpperCase()) {
            case "POSTGRESQL" -> Class.forName("org.postgresql.Driver");
            case "MYSQL" -> Class.forName("com.mysql.cj.jdbc.Driver");
            case "ORACLE" -> Class.forName("oracle.jdbc.driver.OracleDriver");
            case "SQLSERVER" -> Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            default -> throw new RuntimeException("Driver JDBC non trouvé pour : " + dbType);
        }
    }

    /** Classe interne pour le résultat du test de connexion */
    public record TestConnectionResult(boolean success, String message, Long durationMs) {
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
