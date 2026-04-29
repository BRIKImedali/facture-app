package com.pfe.facturation.security.repository;

import com.pfe.facturation.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository JPA pour la table "users".
 *
 * Authentification basée sur le username (identifiant unique de connexion).
 * L'email est un champ de contact optionnel, non utilisé pour l'auth.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** Trouve un utilisateur par son username (identifiant de connexion) */
    Optional<User> findByUsername(String username);

    /** Vérifie si un username est déjà utilisé */
    boolean existsByUsername(String username);

    /** Compte les utilisateurs actifs (pour le dashboard) */
    long countByIsActiveTrue();

    /** Compte tous les utilisateurs par statut */
    long countByIsActive(Boolean isActive);

    /**
     * Recherche d'utilisateurs par username, nom ou prénom.
     * Insensible à la casse.
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<User> searchByUsernameOrName(@Param("query") String query);

    /** Liste des utilisateurs actifs */
    List<User> findByIsActiveTrue();

    /** Liste des utilisateurs inactifs */
    List<User> findByIsActiveFalse();
}
