package com.pfe.facturation.service;

import com.pfe.facturation.dto.DatabaseProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.boot.SpringApplication;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabasePropertiesService {

    
    @Autowired
    private ApplicationContext applicationContext;

    public void generatePropertiesFile(DatabaseProfileDto dto) {
        try {
            // 1. Generate application-{profileName}.properties
            String fileName = "application-" + dto.getProfileName() + ".properties";
            Path propertiesPath = Paths.get("src/main/resources", fileName);
            
            StringBuilder content = new StringBuilder();
            content.append("# Generated Profile: ").append(dto.getProfileName()).append("\n");
            
            String jdbcUrl = "";
            if ("POSTGRESQL".equalsIgnoreCase(dto.getDbType())) {
                jdbcUrl = "jdbc:postgresql://" + dto.getHost() + ":" + dto.getPort() + "/" + dto.getDatabaseName();
                content.append("spring.datasource.driver-class-name=org.postgresql.Driver\n");
            } else if ("MYSQL".equalsIgnoreCase(dto.getDbType())) {
                jdbcUrl = "jdbc:mysql://" + dto.getHost() + ":" + dto.getPort() + "/" + dto.getDatabaseName();
                content.append("spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver\n");
            } else {
                jdbcUrl = "jdbc:" + dto.getDbType().toLowerCase() + "://" + dto.getHost() + ":" + dto.getPort() + "/" + dto.getDatabaseName();
            }
            
            content.append("spring.datasource.url=").append(jdbcUrl).append("\n");
            content.append("spring.datasource.username=").append(dto.getUsername()).append("\n");
            content.append("spring.datasource.password=").append(dto.getPassword()).append("\n");
            content.append("spring.jpa.hibernate.ddl-auto=update\n");  // 👈 tables créées auto
            
            Files.writeString(propertiesPath, content.toString());
            log.info("Generated {}", propertiesPath.toAbsolutePath());

            // 2. Update spring.profiles.active in application.properties
            Path mainPropertiesPath = Paths.get("src/main/resources/application.properties");
            if (Files.exists(mainPropertiesPath)) {
                List<String> lines = Files.readAllLines(mainPropertiesPath);
                boolean found = false;
                for (int i = 0; i < lines.size(); i++) {
                    if (lines.get(i).startsWith("spring.profiles.active=")) {
                        lines.set(i, "spring.profiles.active=" + dto.getProfileName());
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    lines.add(0, "spring.profiles.active=" + dto.getProfileName());
                }
                Files.write(mainPropertiesPath, lines);
                log.info("Updated spring.profiles.active to {}", dto.getProfileName());
            }

            // 3.  Redémarrage automatique après 2 secondes
            Thread restartThread = new Thread(() -> {
                try {
                    Thread.sleep(2000); // attendre que la réponse HTTP soit envoyée
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                log.info("Restarting application to apply new profile: {}", dto.getProfileName());
                SpringApplication.exit(applicationContext, () -> 0);
                System.exit(0);
            });
            restartThread.setDaemon(false);
            restartThread.start();

        } catch (IOException e) {
            log.error("Failed to generate properties file", e);
            throw new RuntimeException("Error generating properties file", e);
        }
    }
}