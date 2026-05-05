package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {

    /** Recherche par nom, ville ou responsable (insensible à la casse) */
    @Query("SELECT s FROM Site s WHERE " +
           "LOWER(s.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(s.ville) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(s.responsable) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Site> search(@Param("q") String query);

    boolean existsByNomIgnoreCase(String nom);
}
