package com.pfe.facturation.security.config;

import com.pfe.facturation.security.entity.Role;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                log.info("Base de données vide. Création des utilisateurs de test...");

                User admin = User.builder()
                        .nom("Admin")
                        .prenom("Super")
                        .email("admin@test.com")
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .build();

                User user = User.builder()
                        .nom("User")
                        .prenom("Simple")
                        .email("user@test.com")
                        .password(passwordEncoder.encode("user123"))
                        .role(Role.USER)
                        .build();

                userRepository.save(admin);
                userRepository.save(user);

                log.info("Utilisateurs créés avec succès :");
                log.info(" ADMIN : admin@test.com / admin123");
                log.info(" USER  : user@test.com / user123");
            }
        };
    }
}
