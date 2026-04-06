package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Long> {

    /** Retourne uniquement les produits actifs (disponibles à la facturation) */
    List<Produit> findByActifTrue();

    /** Recherche sur nom, référence ou description */
    @Query("SELECT p FROM Produit p WHERE " +
           "LOWER(p.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.reference) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Produit> search(@Param("q") String query);
}
