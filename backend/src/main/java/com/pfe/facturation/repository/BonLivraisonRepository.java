package com.pfe.facturation.repository;

import com.pfe.facturation.entity.BonLivraison;
import com.pfe.facturation.entity.StatutBonLivraison;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BonLivraisonRepository extends JpaRepository<BonLivraison, Long> {

    List<BonLivraison> findAllByOrderByDateCreationDesc();

    List<BonLivraison> findByClientIdOrderByDateCreationDesc(Long clientId);

    List<BonLivraison> findByStatutOrderByDateCreationDesc(StatutBonLivraison statut);

    List<BonLivraison> findByCommandeIdOrderByDateCreationDesc(Long commandeId);

    @Query("SELECT COUNT(b) FROM BonLivraison b WHERE EXTRACT(YEAR FROM b.dateCreation) = :year")
    long countByYear(@Param("year") int year);

    /** BL livrés et non encore facturés pour un client — pour la facturation groupée */
    @Query("SELECT b FROM BonLivraison b WHERE b.client.id = :clientId AND b.statut = 'LIVRE' AND b.facture IS NULL ORDER BY b.dateCreation DESC")
    List<BonLivraison> findFacturablesByClientId(@Param("clientId") Long clientId);
}
