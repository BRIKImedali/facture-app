package com.pfe.facturation.service;

import com.pfe.facturation.dto.CreateFactureRequest;
import com.pfe.facturation.dto.UpdateStatutRequest;
import com.pfe.facturation.entity.*;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.ClientRepository;
import com.pfe.facturation.repository.FactureRepository;
import com.pfe.facturation.repository.ProduitRepository;
import com.pfe.facturation.security.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour {@link FactureService}.
 * Utilise Mockito pour isoler la couche service des dépendances externes (BDD).
 */
@ExtendWith(MockitoExtension.class)
class FactureServiceTest {

    @Mock private FactureRepository factureRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ProduitRepository produitRepository;
    @Mock private ClientService clientService;

    @InjectMocks
    private FactureService factureService;

    private Client clientTest;
    private User userTest;
    private Facture factureTest;

    @BeforeEach
    void setUp() {
        clientTest = new Client();
        clientTest.setId(1L);
        clientTest.setNom("ACME Tunisie");

        userTest = new User();
        userTest.setId(1L);
        userTest.setUsername("admin");

        factureTest = Facture.builder()
                .id(10L)
                .numero("FAC-2026-0001")
                .client(clientTest)
                .createdBy(userTest)
                .statut(StatutFacture.BROUILLON)
                .totalHT(new BigDecimal("100.00"))
                .totalTva(new BigDecimal("19.00"))
                .totalTTC(new BigDecimal("119.00"))
                .build();
    }

    // ===== Tests de transitions de statut =====

    @Test
    @DisplayName("BROUILLON → ENVOYEE : transition valide, statut mis à jour")
    void updateStatut_brouillonToEnvoyee_ok() {
        when(factureRepository.findById(10L)).thenReturn(Optional.of(factureTest));
        when(factureRepository.save(any())).thenReturn(factureTest);
        when(clientService.toDTO(any())).thenReturn(null);

        factureService.updateStatut(10L, new UpdateStatutRequest(StatutFacture.ENVOYEE, null));

        verify(factureRepository, times(1)).save(argThat(f -> f.getStatut() == StatutFacture.ENVOYEE));
    }

    @Test
    @DisplayName("BROUILLON → PAYEE : transition invalide, doit lever IllegalStateException")
    void updateStatut_brouillonToPayee_throwsException() {
        when(factureRepository.findById(10L)).thenReturn(Optional.of(factureTest));

        assertThatThrownBy(() -> factureService.updateStatut(10L, new UpdateStatutRequest(StatutFacture.PAYEE, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Transition invalide");
    }

    @Test
    @DisplayName("PAYEE → ANNULEE : état terminal, doit lever IllegalStateException")
    void updateStatut_payeeToAnnulee_throwsException() {
        factureTest.setStatut(StatutFacture.PAYEE);
        when(factureRepository.findById(10L)).thenReturn(Optional.of(factureTest));

        assertThatThrownBy(() -> factureService.updateStatut(10L, new UpdateStatutRequest(StatutFacture.ANNULEE, null)))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("ANNULEE → ENVOYEE : état terminal, doit lever IllegalStateException")
    void updateStatut_annuleeToEnvoyee_throwsException() {
        factureTest.setStatut(StatutFacture.ANNULEE);
        when(factureRepository.findById(10L)).thenReturn(Optional.of(factureTest));

        assertThatThrownBy(() -> factureService.updateStatut(10L, new UpdateStatutRequest(StatutFacture.ENVOYEE, null)))
                .isInstanceOf(IllegalStateException.class);
    }

    // ===== Tests de suppression =====

    @Test
    @DisplayName("Supprimer une facture PAYEE : doit lever IllegalStateException")
    void delete_payeeFacture_throwsException() {
        factureTest.setStatut(StatutFacture.PAYEE);
        when(factureRepository.findById(10L)).thenReturn(Optional.of(factureTest));

        assertThatThrownBy(() -> factureService.delete(10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("payée");
    }

    @Test
    @DisplayName("Supprimer une facture BROUILLON : doit réussir sans exception")
    void delete_brouillonFacture_ok() {
        when(factureRepository.findById(10L)).thenReturn(Optional.of(factureTest));
        doNothing().when(factureRepository).deleteById(10L);

        assertThatCode(() -> factureService.delete(10L))
                .doesNotThrowAnyException();

        verify(factureRepository).deleteById(10L);
    }

    // ===== Tests de lecture =====

    @Test
    @DisplayName("findById avec ID inexistant : doit lever ResourceNotFoundException")
    void findById_unknownId_throwsResourceNotFoundException() {
        when(factureRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> factureService.findById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    // ===== Tests de création =====

    @Test
    @DisplayName("Création avec client inexistant : doit lever ResourceNotFoundException")
    void create_unknownClient_throwsException() {
        when(clientRepository.findById(99L)).thenReturn(Optional.empty());

        CreateFactureRequest request = new CreateFactureRequest(
                99L, LocalDate.now().plusDays(30), "Test", null,
                List.of(new CreateFactureRequest.LigneRequest(null, "Service A", 1, new BigDecimal("500.00"), 19.0))
        );

        assertThatThrownBy(() -> factureService.create(request, userTest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Création valide : les montants HT/TVA/TTC sont correctement calculés")
    void create_validRequest_computesTotalsCorrectly() {
        when(clientRepository.findById(1L)).thenReturn(Optional.of(clientTest));
        when(factureRepository.countByYear(anyInt())).thenReturn(0L);
        when(factureRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(clientService.toDTO(any())).thenReturn(null);

        CreateFactureRequest request = new CreateFactureRequest(
                1L, null, null, null,
                List.of(
                        // 2 unités × 100 TND HT @ 19% TVA = 200 HT + 38 TVA = 238 TTC
                        new CreateFactureRequest.LigneRequest(null, "Conseil", 2, new BigDecimal("100.00"), 19.0)
                )
        );

        var result = factureService.create(request, userTest);

        // Vérification des totaux calculés
        assertThat(result).isNotNull();
        // Le DTO retourné ici peut être null selon le mock de clientService.toDTO
        // On vérifie que save() a été appelé avec les bons montants
        verify(factureRepository, atLeastOnce()).save(argThat(f -> {
            boolean htOk   = f.getTotalHT()  != null && f.getTotalHT().compareTo(new BigDecimal("200.00")) == 0;
            boolean tvaOk  = f.getTotalTva() != null && f.getTotalTva().compareTo(new BigDecimal("38.00")) == 0;
            boolean ttcOk  = f.getTotalTTC() != null && f.getTotalTTC().compareTo(new BigDecimal("238.00")) == 0;
            return htOk && tvaOk && ttcOk;
        }));
    }
}
