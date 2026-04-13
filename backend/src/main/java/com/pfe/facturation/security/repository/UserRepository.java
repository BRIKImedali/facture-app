package com.pfe.facturation.security.repository;

import com.pfe.facturation.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA pour la table "users" — mis à jour pour le module admin.
 *
 * Nouvelles méthodes :
 * - countByIsActiveTrue : nombre d'utilisateurs actifs
 * - searchByEmailOrName : recherche par email/nom/prénom
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Trouve un utilisateur par son email */
    Optional<User> findByEmail(String email);

    /** Vérifie si un email est déjà utilisé */
    boolean existsByEmail(String email);

    /** Compte les utilisateurs actifs (pour le dashboard) */
    long countByIsActiveTrue();

    /** Compte tous les utilisateurs actifs */
    long countByIsActive(Boolean isActive);

    /**
     * Recherche d'utilisateurs par email, nom ou prénom.
     * Insensible à la casse.
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchByEmailOrName(@Param("query") String query);

    /** Liste des utilisateurs actifs */
    List<User> findByIsActiveTrue();

    /** Liste des utilisateurs inactifs */
    List<User> findByIsActiveFalse();
}
