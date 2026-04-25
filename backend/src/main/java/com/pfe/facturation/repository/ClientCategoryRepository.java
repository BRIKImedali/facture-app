package com.pfe.facturation.repository;

import com.pfe.facturation.entity.ClientCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClientCategoryRepository extends JpaRepository<ClientCategory, Long> {
    Optional<ClientCategory> findByCode(String code);
}
