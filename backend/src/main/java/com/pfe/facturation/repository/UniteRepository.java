package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Unite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UniteRepository extends JpaRepository<Unite, Long> {
    Optional<Unite> findByNom(String nom);
    boolean existsByNom(String nom);

    @Query("SELECT u FROM Unite u WHERE LOWER(u.nom) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Unite> searchByNom(String query);
}
