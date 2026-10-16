package com.ascendons.geo.repository;

import com.ascendons.geo.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, String> {
    Optional<Currency> findByIsBaseTrue();
    List<Currency> findByIsActiveTrue();
}
