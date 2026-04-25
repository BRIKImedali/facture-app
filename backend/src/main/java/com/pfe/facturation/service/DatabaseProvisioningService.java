// DatabaseProvisioningService.java
// Crée une nouvelle base de données PostgreSQL et y initialise le schéma complet
// (toutes les tables de l'application) à partir des entités JPA existantes.
package com.pfe.facturation.service;

import com.pfe.facturation.model.DatabaseProfile;
import com.pfe.facturation.util.EncryptionUtil;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

/**
 * Service qui provisionne automatiquement une nouvelle base de données :
 * 1. Crée la BDD PostgreSQL si elle n'existe pas (via connexion sur "postgres")
 * 2. Crée toutes les tables (basées sur les entités JPA de l'application)
 * 3. Teste la connexion finale
 *
 * Utilisé lors de la création/activation d'un profil de connexion depuis le formulaire admin.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseProvisioningService {

    private final EncryptionUtil encryptionUtil;

    @Value("${spring.datasource.url}")
    private String masterJdbcUrl;

    @Value("${spring.datasource.username}")
    private String masterUsername;

    @Value("${spring.datasource.password}")
    private String masterPassword;

    /**
     * Point d'entrée principal : crée la BDD et initialise toutes les tables.
     *
     * @param profile Le profil BDD (avec mot de passe chiffré)
     * @return Message de résultat
     */
    public String provisionDatabase(DatabaseProfile profile) {
        String password = encryptionUtil.decrypt(profile.getPasswordEncrypted());
        String dbName   = profile.getDatabaseName();
        String host     = profile.getHost();
        int    port     = profile.getPort();
        String username = profile.getUsername();

        log.info("=== Démarrage du provisionnement de la BDD '{}' ===", dbName);

        // 1. Créer la base de données PostgreSQL
        createDatabaseIfNotExists(host, port, username, password, dbName);

        // 2. Créer toutes les tables via Hibernate DDL
        initializeSchema(host, port, username, password, dbName);

        log.info("=== Provisionnement terminé avec succès pour '{}' ===", dbName);
        return "Base de données '" + dbName + "' créée et schéma initialisé avec succès.";
    }

    /**
     * Se connecte au serveur PostgreSQL (base "postgres") et crée la nouvelle BDD
     * si elle n'existe pas déjà.
     */
    private void createDatabaseIfNotExists(String host, int port, String user, String password, String dbName) {
        // On se connecte sur la BDD "postgres" (BDD système toujours présente)
        String adminUrl = String.format("jdbc:postgresql://%s:%d/postgres", host, port);

        try (Connection conn = DriverManager.getConnection(adminUrl, user, password);
             Statement stmt = conn.createStatement()) {

            // Vérifier si la base existe
            var rs = stmt.executeQuery(
                "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'"
            );

            if (!rs.next()) {
                // La base n'existe pas : on la crée
                stmt.execute("CREATE DATABASE \"" + dbName + "\"");
                log.info("Base de données '{}' créée avec succès.", dbName);
            } else {
                log.info("Base de données '{}' existe déjà, on passe à l'initialisation du schéma.", dbName);
            }

        } catch (Exception e) {
            log.error("Impossible de créer la base de données '{}': {}", dbName, e.getMessage());
            throw new RuntimeException("Erreur lors de la création de la base de données : " + e.getMessage(), e);
        }
    }

    /**
     * Crée ou met à jour les tables dans la nouvelle BDD en utilisant Hibernate DDL.
     *
     * Comportement :
     * - BDD EXISTE avec données → garde toutes les données, ajoute les colonnes manquantes
     * - BDD VIDE ou NOUVELLE → crée toutes les tables
     */
    private void initializeSchema(String host, int port, String user, String password, String dbName) {
        String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);
        log.info("Initialisation du schéma (mode UPDATE) sur : {}", jdbcUrl);

        // Créer un DataSource temporaire sur la nouvelle BDD
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(user);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(2);
        config.setConnectionTimeout(10_000);

        try (HikariDataSource tempDataSource = new HikariDataSource(config)) {

            // Créer un EntityManagerFactory temporaire sur cette nouvelle datasource
            LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
            emf.setDataSource(tempDataSource);
            emf.setPackagesToScan(
                "com.pfe.facturation.entity",
                "com.pfe.facturation.model",
                "com.pfe.facturation.security.entity"
            );

            HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
            adapter.setGenerateDdl(true);
            emf.setJpaVendorAdapter(adapter);

            Map<String, Object> props = new HashMap<>();
            // UPDATE = crée les tables manquantes, garde les données existantes
            // Ne supprime JAMAIS les tables ou données existantes
            props.put("hibernate.hbm2ddl.auto", "update");
            props.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            props.put("hibernate.show_sql", false);
            emf.setJpaPropertyMap(props);

            emf.afterPropertiesSet();

            // Ouvrir et fermer un EntityManager pour déclencher le DDL update
            var factory = emf.getNativeEntityManagerFactory();
            var em = factory.createEntityManager();
            em.close();
            factory.close();

            log.info("Schéma mis à jour avec succès dans '{}' (données conservées).", dbName);

        } catch (Exception e) {
            log.error("Erreur lors de l'initialisation du schéma : {}", e.getMessage());
            throw new RuntimeException("Erreur d'initialisation du schéma : " + e.getMessage(), e);
        }
    }

    /**
     * Met à jour application.properties avec les coordonnées du profil activé.
     * L'application pointera vers cette BDD au prochain démarrage.
     *
     * @param profile Le profil nouvellement activé (mot de passe chiffré)
     */
    public void updateApplicationProperties(DatabaseProfile profile) {
        String password = encryptionUtil.decrypt(profile.getPasswordEncrypted());
        String newJdbcUrl = String.format("jdbc:postgresql://%s:%d/%s",
                profile.getHost(), profile.getPort(), profile.getDatabaseName());

        try {
            java.nio.file.Path propsPath = java.nio.file.Paths.get("src/main/resources/application.properties");
            java.util.List<String> lines = java.nio.file.Files.readAllLines(propsPath);

            for (int i = 0; i < lines.size(); i++) {
                if (lines.get(i).startsWith("spring.datasource.url=")) {
                    lines.set(i, "spring.datasource.url=" + newJdbcUrl);
                } else if (lines.get(i).startsWith("spring.datasource.username=")) {
                    lines.set(i, "spring.datasource.username=" + profile.getUsername());
                } else if (lines.get(i).startsWith("spring.datasource.password=")) {
                    lines.set(i, "spring.datasource.password=" + password);
                }
            }

            java.nio.file.Files.write(propsPath, lines);
            log.info("application.properties mis à jour → nouvelle BDD active : {}", newJdbcUrl);

        } catch (Exception e) {
            log.error("Impossible de mettre à jour application.properties : {}", e.getMessage());
            throw new RuntimeException("Erreur de mise à jour de la configuration : " + e.getMessage(), e);
        }
    }
}
