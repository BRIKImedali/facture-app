package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Emplacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmplacementRepository extends JpaRepository<Emplacement, Long> {

    /** Tous les emplacements d'un site donné */
    List<Emplacement> findBySiteId(Long siteId);

    /** Recherche par zone ou description */
    @Query("SELECT e FROM Emplacement e WHERE " +
           "LOWER(e.zone) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(e.description) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Emplacement> search(@Param("q") String query);
}
