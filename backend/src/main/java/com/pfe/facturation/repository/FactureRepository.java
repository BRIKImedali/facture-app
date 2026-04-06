package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Facture;
import com.pfe.facturation.entity.StatutFacture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Pageable;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    /** Factures d'un client spécifique */
    List<Facture> findByClientIdOrderByDateEmissionDesc(Long clientId);

    /** Factures par statut */
    List<Facture> findByStatutOrderByDateEmissionDesc(StatutFacture statut);

    /** Toutes les factures, triées par date décroissante */
    List<Facture> findAllByOrderByDateEmissionDesc();

    /** Compte les factures créées dans une année donnée — pour générer le numéro */
    @Query("SELECT COUNT(f) FROM Facture f WHERE EXTRACT(YEAR FROM f.dateEmission) = :year")
    long countByYear(@Param("year") int year);

    /** Chiffre d'affaires total (sum TTC des factures payées) */
    @Query("SELECT COALESCE(SUM(f.totalTTC), 0) FROM Facture f WHERE f.statut = :statut")
    BigDecimal sumTotalTTCPayees(@Param("statut") StatutFacture statut);

    /** Dashboard stats : nombre de factures par statut */
    @Query("SELECT f.statut, COUNT(f) FROM Facture f GROUP BY f.statut")
    List<Object[]> countByStatut();

    /** Dashboard stats : top clients par chiffre d'affaires */
    @Query("SELECT f.client, SUM(f.totalTTC) as ca FROM Facture f WHERE f.statut = :statut GROUP BY f.client ORDER BY ca DESC")
    List<Object[]> findTopClientsByRevenue(@Param("statut") StatutFacture statut, Pageable pageable);

    /** Dashboard stats : CA encaissé par mois sur une année spécifique */
    @Query("SELECT EXTRACT(MONTH FROM f.dateEmission) as mois, SUM(f.totalTTC) FROM Facture f WHERE f.statut = :statut AND EXTRACT(YEAR FROM f.dateEmission) = :year GROUP BY mois ORDER BY mois")
    List<Object[]> findRevenueByMonth(@Param("statut") StatutFacture statut, @Param("year") int year);
}
