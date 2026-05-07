package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Commande;
import com.pfe.facturation.entity.StatutCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {
    List<Commande> findByClientIdOrderByDateCommandeDesc(Long clientId);
    List<Commande> findByStatutOrderByDateCommandeDesc(StatutCommande statut);
    List<Commande> findAllByOrderByDateCommandeDesc();

    @Query("SELECT COUNT(c) FROM Commande c WHERE EXTRACT(YEAR FROM c.dateCommande) = :year")
    long countByYear(@Param("year") int year);
}
