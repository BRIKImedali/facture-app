package com.pfe.facturation.repository;

import com.pfe.facturation.entity.Devise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviseRepository extends JpaRepository<Devise, Long> {

    boolean existsByCode(String code);

    List<Devise> findByActifTrue();
}
