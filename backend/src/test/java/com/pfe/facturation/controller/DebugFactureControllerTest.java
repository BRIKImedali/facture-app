package com.pfe.facturation.controller;

import com.pfe.facturation.dto.CreateFactureRequest;
import com.pfe.facturation.entity.Client;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.repository.UserRepository;
import com.pfe.facturation.service.FactureService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Désactiver sécurité pour le test
@ActiveProfiles("dev")
class DebugFactureControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FactureService factureService;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testFindById() throws Exception {
        User admin = userRepository.findByUsername("admin").orElse(null);
        Client client = new Client();
        client.setNom("MockMvc Client");
        clientRepository.save(client);

        CreateFactureRequest req = new CreateFactureRequest(
                client.getId(),
                null,
                "notes",
                null,
                List.of(new CreateFactureRequest.LigneRequest(null, "Test Ligne", 5, new BigDecimal("100"), 20.0))
        );

        Long id = factureService.create(req, admin).id();

        mockMvc.perform(get("/api/factures/" + id))
                .andDo(print())
                .andExpect(status().isOk());
    }
}
