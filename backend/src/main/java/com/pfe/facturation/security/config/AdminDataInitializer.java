// AdminDataInitializer.java — Initialisation des données admin au démarrage
package com.pfe.facturation.security.config;

import com.pfe.facturation.model.AppRole;
import com.pfe.facturation.repository.AppRoleRepository;
import com.pfe.facturation.security.entity.Role;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.repository.UserRepository;
import com.pfe.facturation.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

/**
 * Initialisation des données du module d'administration au démarrage.
 *
 * Exécuté APRÈS le DataInitializer existant (@Order(2)).
 * 
 * Actions :
 * 1. Crée les permissions par défaut (24 permissions)
 * 2. Crée les rôles par défaut (SUPER_ADMIN, ADMIN, MANAGER, USER, VIEWER)
 * 3. Assigne le rôle SUPER_ADMIN à l'admin existant (admin@test.com)
 */
@Configuration
@RequiredArgsConstructor
public class AdminDataInitializer {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);

    private final RoleService roleService;
    private final UserRepository userRepository;
    private final AppRoleRepository appRoleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * CommandLineRunner @Order(2) — s'exécute après le DataInitializer (implicitement @Order(1)).
     */
    @Bean
    @Order(2)
    public CommandLineRunner initAdminData() {
        return args -> {
            log.info("=== Initialisation du module d'administration ===");

            // 1. Créer les permissions et rôles par défaut
            roleService.initDefaultData();

            // 2. Assigner SUPER_ADMIN à l'utilisateur admin existant
            assignSuperAdminToAdmin();

            log.info("=== Module d'administration initialisé ===");
        };
    }

    /**
     * Assigne le rôle SUPER_ADMIN à l'utilisateur admin.
     */
    private void assignSuperAdminToAdmin() {
        Optional<User> adminOpt = userRepository.findByUsername("admin");
        Optional<AppRole> superAdminRole = appRoleRepository.findByName("SUPER_ADMIN");

        if (adminOpt.isPresent() && superAdminRole.isPresent()) {
            User admin = adminOpt.get();
            AppRole superAdmin = superAdminRole.get();

            // Vérifier si le rôle n'est pas déjà assigné
            if (admin.getAppRoles() == null || admin.getAppRoles().isEmpty() ||
                admin.getAppRoles().stream().noneMatch(r -> "SUPER_ADMIN".equals(r.getName()))) {

                admin.setAppRoles(List.of(superAdmin));
                userRepository.save(admin);
                log.info("Rôle SUPER_ADMIN assigné à l'utilisateur admin");
            }
        }

        // Assigner VIEWER à l'utilisateur user
        Optional<User> userOpt = userRepository.findByUsername("user");
        Optional<AppRole> viewerRole = appRoleRepository.findByName("USER");

        if (userOpt.isPresent() && viewerRole.isPresent()) {
            User simpleUser = userOpt.get();
            if (simpleUser.getAppRoles() == null || simpleUser.getAppRoles().isEmpty()) {
                simpleUser.setAppRoles(List.of(viewerRole.get()));
                userRepository.save(simpleUser);
                log.info("Rôle USER assigné à l'utilisateur user");
            }
        }
    }
}
