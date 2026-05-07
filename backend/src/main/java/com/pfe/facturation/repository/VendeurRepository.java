package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Vendeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendeurRepository extends JpaRepository<Vendeur, Long> {

    boolean existsByEmail(String email);

    boolean existsByMatriculeInterne(String matriculeInterne);

    Optional<Vendeur> findByEmail(String email);

    @Query("SELECT v FROM Vendeur v WHERE " +
           "LOWER(v.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(v.prenom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(v.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(v.matriculeInterne) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(v.ville) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Vendeur> search(@Param("q") String q);

    List<Vendeur> findByActifTrue();
}
