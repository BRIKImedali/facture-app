package com.pfe.facturation.service;

import com.pfe.facturation.dto.StockDTO;
import com.pfe.facturation.entity.Emplacement;
import com.pfe.facturation.entity.Produit;
import com.pfe.facturation.entity.Site;
import com.pfe.facturation.entity.Stock;
import com.pfe.facturation.exception.ResourceNotFoundException;
import com.pfe.facturation.repository.ProduitRepository;
import com.pfe.facturation.repository.StockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final StockRepository stockRepository;
    private final ProduitRepository produitRepository;
    private final SiteService siteService;
    private final EmplacementService emplacementService;

    public StockService(StockRepository stockRepository,
                        ProduitRepository produitRepository,
                        SiteService siteService,
                        EmplacementService emplacementService) {
        this.stockRepository       = stockRepository;
        this.produitRepository     = produitRepository;
        this.siteService           = siteService;
        this.emplacementService    = emplacementService;
    }

    // ===== Lecture =====

    @Transactional(readOnly = true)
    public List<StockDTO> findAll() {
        return stockRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public StockDTO findById(Long id) {
        return toDTO(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<StockDTO> findByProduit(Long produitId) {
        return stockRepository.findByProduitId(produitId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<StockDTO> findBySite(Long siteId) {
        return stockRepository.findBySiteId(siteId).stream().map(this::toDTO).toList();
    }

    /**
     * Retourne uniquement les stocks dont la quantité est ≤ au seuil minimum.
     * Peut être filtré par site si {@code siteId} est fourni.
     */
    @Transactional(readOnly = true)
    public List<StockDTO> findAlertes(Long siteId) {
        List<Stock> alertes = (siteId != null)
                ? stockRepository.findStocksEnAlerteBySite(siteId)
                : stockRepository.findStocksEnAlerte();
        return alertes.stream().map(this::toDTO).toList();
    }

    // ===== Écriture =====

    public StockDTO create(StockDTO dto) {
        Produit produit = getProduitOrThrow(dto.produitId());
        Site    site    = siteService.getOrThrow(dto.siteId());
        Emplacement emplacement = resolveEmplacement(dto.emplacementId());

        Stock stock = Stock.builder()
                .produit(produit)
                .site(site)
                .emplacement(emplacement)
                .quantite(dto.quantite() != null ? dto.quantite() : 0)
                .seuilMinimum(dto.seuilMinimum() != null ? dto.seuilMinimum() : 0)
                .build();

        Stock saved = stockRepository.save(stock);
        logAlerte(saved);
        log.info("Stock créé : id={}, produit={}, site={}", saved.getId(), produit.getNom(), site.getNom());
        return toDTO(saved);
    }

    public StockDTO update(Long id, StockDTO dto) {
        Stock existing = getOrThrow(id);

        existing.setProduit(getProduitOrThrow(dto.produitId()));
        existing.setSite(siteService.getOrThrow(dto.siteId()));
        existing.setEmplacement(resolveEmplacement(dto.emplacementId()));
        if (dto.quantite()      != null) existing.setQuantite(dto.quantite());
        if (dto.seuilMinimum()  != null) existing.setSeuilMinimum(dto.seuilMinimum());

        Stock saved = stockRepository.save(existing);
        logAlerte(saved);
        log.info("Stock mis à jour : id={}", id);
        return toDTO(saved);
    }

    /**
     * Entrée de stock : ajoute une quantité positive.
     */
    public StockDTO entree(Long id, int quantite) {
        if (quantite <= 0) throw new IllegalArgumentException("La quantité d'entrée doit être positive");
        Stock stock = getOrThrow(id);
        stock.setQuantite(stock.getQuantite() + quantite);
        Stock saved = stockRepository.save(stock);
        log.info("Entrée stock : id={}, +{} → {}", id, quantite, saved.getQuantite());
        return toDTO(saved);
    }

    /**
     * Sortie de stock : déduit une quantité. Refuse si stock insuffisant.
     */
    public StockDTO sortie(Long id, int quantite) {
        if (quantite <= 0) throw new IllegalArgumentException("La quantité de sortie doit être positive");
        Stock stock = getOrThrow(id);
        if (stock.getQuantite() < quantite) {
            throw new IllegalStateException(
                "Stock insuffisant : disponible=" + stock.getQuantite() + ", demandé=" + quantite);
        }
        stock.setQuantite(stock.getQuantite() - quantite);
        Stock saved = stockRepository.save(stock);
        logAlerte(saved);
        log.info("Sortie stock : id={}, -{} → {}", id, quantite, saved.getQuantite());
        return toDTO(saved);
    }

    public void delete(Long id) {
        if (!stockRepository.existsById(id)) {
            throw new ResourceNotFoundException("Stock introuvable avec l'id : " + id);
        }
        stockRepository.deleteById(id);
        log.info("Stock supprimé : id={}", id);
    }

    // ===== Mapper =====

    public StockDTO toDTO(Stock s) {
        String emplacementLabel = null;
        Long emplacementId = null;
        if (s.getEmplacement() != null) {
            Emplacement e = s.getEmplacement();
            emplacementId = e.getId();
            emplacementLabel = String.join(" / ",
                    e.getZone() != null ? e.getZone() : "",
                    e.getRayon() != null ? e.getRayon() : "",
                    e.getEtagere() != null ? e.getEtagere() : ""
            ).replaceAll("( / )+$", "").trim();
        }

        return new StockDTO(
                s.getId(),
                s.getProduit().getId(),
                s.getProduit().getNom(),
                s.getSite().getId(),
                s.getSite().getNom(),
                emplacementId,
                emplacementLabel,
                s.getQuantite(),
                s.getSeuilMinimum(),
                s.isEnAlerte(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    // ===== Helpers =====

    public Stock getOrThrow(Long id) {
        return stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock introuvable avec l'id : " + id));
    }

    private Produit getProduitOrThrow(Long produitId) {
        return produitRepository.findById(produitId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable avec l'id : " + produitId));
    }

    private Emplacement resolveEmplacement(Long emplacementId) {
        if (emplacementId == null) return null;
        return emplacementService.getOrThrow(emplacementId);
    }

    private void logAlerte(Stock s) {
        if (s.isEnAlerte()) {
            log.warn("⚠️ ALERTE STOCK : produit='{}', site='{}', quantite={}, seuil={}",
                    s.getProduit().getNom(), s.getSite().getNom(),
                    s.getQuantite(), s.getSeuilMinimum());
        }
    }
}
