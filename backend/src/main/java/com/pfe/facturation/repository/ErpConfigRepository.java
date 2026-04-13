// ErpConfigRepository.java — Repository pour les configurations ERP
package com.pfe.facturation.repository;

import com.pfe.facturation.model.ErpConfig;
import com.pfe.facturation.model.ErpSyncHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des configurations ERP.
 */
@Repository
public interface ErpConfigRepository extends JpaRepository<ErpConfig, Long> {

    /** Trouve toutes les configurations actives */
    List<ErpConfig> findByIsActiveTrue();

    /** Trouve la configuration active pour un type ERP */
    Optional<ErpConfig> findByErpTypeAndIsActiveTrue(String erpType);

    /** Vérifie si une configuration existe pour ce type */
    boolean existsByErpType(String erpType);

    /** Trouve les configurations par type */
    List<ErpConfig> findByErpType(String erpType);
}
