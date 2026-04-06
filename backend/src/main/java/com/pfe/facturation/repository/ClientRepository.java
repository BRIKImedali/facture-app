package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    /** Vérifie si un email est déjà utilisé par un autre client */
    boolean existsByEmail(String email);

    /** Recherche textuelle sur nom, email ou ville (insensible à la casse) */
    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.nom) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.ville) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Client> search(@Param("q") String query);
}
