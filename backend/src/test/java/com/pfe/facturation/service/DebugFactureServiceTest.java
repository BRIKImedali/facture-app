package com.pfe.facturation.service;

import com.pfe.facturation.dto.CreateFactureRequest;
import com.pfe.facturation.dto.FactureResponseDTO;
import com.pfe.facturation.entity.Client;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.security.entity.User;
import com.pfe.facturation.security.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
@ActiveProfiles("dev")
class DebugFactureServiceTest {

    @Autowired
    private FactureService factureService;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testFindByIdExplodes() {
        User admin = userRepository.findByEmail("admin@test.com").orElseThrow();
        Client client = new Client();
        client.setNom("Test Client");
        clientRepository.save(client);

        CreateFactureRequest req = new CreateFactureRequest(
                client.getId(),
                null,
                "notes",
                List.of(new CreateFactureRequest.LigneRequest(null, "Test Ligne", 5, new BigDecimal("100"), 20.0))
        );

        FactureResponseDTO created = factureService.create(req, admin);
        System.out.println("CREATED ID = " + created.id());

        FactureResponseDTO found = factureService.findById(created.id());
        System.out.println("FOUND FACTURE: " + found.numero());

        List<FactureResponseDTO> all = factureService.findAll();
        System.out.println("TOTAL FACTURES: " + all.size());
    }
}
