package com.pfe.facturation;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Vérifie que le contexte Spring Boot se charge correctement.
 */
@SpringBootTest
@ActiveProfiles("dev")
class FacturationApplicationTests {

    @Test
    void contextLoads() {
        // Si ce test passe, le contexte Spring se charge sans erreur.
    }
}
