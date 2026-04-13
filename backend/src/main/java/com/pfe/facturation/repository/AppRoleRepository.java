// AppRoleRepository.java — Repository JPA pour les rôles applicatifs
package com.pfe.facturation.repository;

import com.pfe.facturation.model.AppRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Repository pour la gestion des rôles applicatifs.
 */
@Repository
public interface AppRoleRepository extends JpaRepository<AppRole, Long> {

    /** Trouve un rôle par son nom */
    Optional<AppRole> findByName(String name);

    /** Vérifie si un rôle avec ce nom existe */
    boolean existsByName(String name);

    /** Liste tous les rôles non-système (modifiables) */
    List<AppRole> findByIsSystemRoleFalse();

    /** Liste tous les rôles système (non modifiables) */
    List<AppRole> findByIsSystemRoleTrue();

    /** Trouve plusieurs rôles par leurs IDs */
    @Query("SELECT ar FROM AppRole ar WHERE ar.id IN :ids")
    List<AppRole> findAllByIdIn(@Param("ids") Set<Long> ids);

    /** Recherche de rôles par nom (insensible à la casse) */
    @Query("SELECT ar FROM AppRole ar WHERE LOWER(ar.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<AppRole> searchByName(@Param("search") String search);

    /** Rôles assignés à un utilisateur donné */
    @Query("SELECT ar FROM AppRole ar JOIN ar.permissions p " +
           "WHERE ar.id IN (SELECT ur.id FROM User u JOIN u.appRoles ur WHERE u.id = :userId)")
    List<AppRole> findByUserId(@Param("userId") Long userId);
}
