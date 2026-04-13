// PermissionRepository.java — Repository pour les permissions granulaires
package com.pfe.facturation.repository;

import com.pfe.facturation.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des permissions du système.
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /** Trouve une permission par son entité et action */
    Optional<Permission> findByEntityAndAction(String entity, String action);

    /** Vérifie l'existence d'une permission */
    boolean existsByEntityAndAction(String entity, String action);

    /** Liste toutes les permissions d'une entité donnée */
    List<Permission> findByEntity(String entity);

    /** Liste toutes les permissions d'une action donnée */
    List<Permission> findByAction(String action);

    /** Toutes les permissions triées par entité puis action */
    @Query("SELECT p FROM Permission p ORDER BY p.entity, p.action")
    List<Permission> findAllOrderedByEntityAndAction();

    /** Permissions associées à un rôle */
    @Query("SELECT p FROM AppRole r JOIN r.permissions p WHERE r.id = :roleId")
    List<Permission> findByRoleId(@Param("roleId") Long roleId);
}
