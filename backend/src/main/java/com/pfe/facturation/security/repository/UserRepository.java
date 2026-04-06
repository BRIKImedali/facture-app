package com.pfe.facturation.security.repository;

import com.pfe.facturation.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository JPA pour la table "users".
 *
 * JpaRepository<User, Long> nous donne GRATUITEMENT :
 *  - save(user)      → INSERT ou UPDATE
 *  - findById(id)    → SELECT par id
 *  - findAll()       → SELECT *
 *  - deleteById(id)  → DELETE
 *  - existsById(id)  → SELECT COUNT
 *
 * On ajoute seulement les méthodes dont on a besoin en plus.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring Data JPA génère automatiquement la requête SQL depuis le nom de la méthode
    // → SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Utile pour vérifier si l'email est déjà pris lors de l'inscription
    boolean existsByEmail(String email);
}
