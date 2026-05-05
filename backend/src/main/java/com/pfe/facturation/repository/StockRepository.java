package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    List<Stock> findByProduitId(Long produitId);

    List<Stock> findBySiteId(Long siteId);

    List<Stock> findByEmplacementId(Long emplacementId);

    /** Stocks en alerte : quantite <= seuilMinimum */
    @Query("SELECT s FROM Stock s WHERE s.quantite <= s.seuilMinimum")
    List<Stock> findStocksEnAlerte();

    /** Stocks en alerte pour un site spécifique */
    @Query("SELECT s FROM Stock s WHERE s.quantite <= s.seuilMinimum AND s.site.id = :siteId")
    List<Stock> findStocksEnAlerteBySite(@Param("siteId") Long siteId);

    boolean existsByProduitIdAndSiteIdAndEmplacementId(Long produitId, Long siteId, Long emplacementId);
}
