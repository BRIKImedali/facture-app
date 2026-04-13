// DatabaseProfileRepository.java — Repository pour les profils de connexion BDD
package com.pfe.facturation.repository;

import com.pfe.facturation.model.DatabaseProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des profils de connexion à la base de données.
 */
@Repository
public interface DatabaseProfileRepository extends JpaRepository<DatabaseProfile, Long> {

    /** Trouve un profil par son nom */
    Optional<DatabaseProfile> findByProfileName(String profileName);

    /** Vérifie si un profil avec ce nom existe */
    boolean existsByProfileName(String profileName);

    /** Trouve le profil actuellement actif */
    Optional<DatabaseProfile> findByIsActiveTrue();

    /** Trouve le profil par défaut */
    Optional<DatabaseProfile> findByIsDefaultTrue();

    /** Liste tous les profils d'un type de BDD donné */
    List<DatabaseProfile> findByDbType(String dbType);

    /**
     * Désactive TOUS les profils actifs (avant d'en activer un nouveau).
     * Crucial pour garantir qu'un seul profil est actif à la fois.
     */
    @Modifying
    @Query("UPDATE DatabaseProfile dp SET dp.isActive = false WHERE dp.isActive = true")
    void deactivateAllProfiles();

    /**
     * Désactive tous les profils par défaut (avant d'en définir un nouveau).
     */
    @Modifying
    @Query("UPDATE DatabaseProfile dp SET dp.isDefault = false WHERE dp.isDefault = true")
    void unsetAllDefaultProfiles();

    /** Recherche de profils par nom (insensible à la casse) */
    @Query("SELECT dp FROM DatabaseProfile dp WHERE LOWER(dp.profileName) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<DatabaseProfile> searchByProfileName(@Param("search") String search);
}
