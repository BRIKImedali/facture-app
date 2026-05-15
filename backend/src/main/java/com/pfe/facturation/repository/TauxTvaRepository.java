package com.pfe.facturation.repository;

import com.pfe.facturation.entity.TauxTva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TauxTvaRepository extends JpaRepository<TauxTva, Long> {

    /** Récupère tous les taux actifs, triés par valeur croissante */
    List<TauxTva> findByActifTrueOrderByValeurAsc();

    /** Vérifie l'existence d'un taux avec la même valeur */
    boolean existsByValeur(Double valeur);

    /** Compte le nombre de taux actifs — pour la règle métier "dernier taux actif" */
    long countByActifTrue();
}
