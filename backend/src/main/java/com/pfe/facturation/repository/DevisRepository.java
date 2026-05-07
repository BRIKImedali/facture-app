package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Devis;
import com.pfe.facturation.entity.StatutDevis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevisRepository extends JpaRepository<Devis, Long> {
    List<Devis> findByClientIdOrderByDateDevisDesc(Long clientId);
    List<Devis> findByStatutOrderByDateDevisDesc(StatutDevis statut);
    List<Devis> findAllByOrderByDateDevisDesc();

    @Query("SELECT COUNT(d) FROM Devis d WHERE EXTRACT(YEAR FROM d.dateDevis) = :year")
    long countByYear(@Param("year") int year);
}
