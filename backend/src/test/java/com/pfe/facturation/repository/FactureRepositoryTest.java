package com.pfe.facturation.repository;

import com.pfe.facturation.entity.StatutFacture;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class FactureRepositoryTest {

    @Autowired
    private FactureRepository factureRepository;

    @Test
    void testQueries() {
        System.out.println("Running test for top clients");
        factureRepository.findTopClientsByRevenue(StatutFacture.PAYEE, PageRequest.of(0, 5));
        
        System.out.println("Running test for revenue by month");
        factureRepository.findRevenueByMonth(StatutFacture.PAYEE, 2026);
    }
}
