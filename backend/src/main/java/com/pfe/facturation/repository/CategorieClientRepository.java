package com.pfe.facturation.repository;

import com.pfe.facturation.entity.CategorieClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategorieClientRepository extends JpaRepository<CategorieClient, Long> {
    Optional<CategorieClient> findByNom(String nom);
    boolean existsByNom(String nom);

    @Query("SELECT c FROM CategorieClient c WHERE LOWER(c.nom) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CategorieClient> searchByNom(String query);
}
