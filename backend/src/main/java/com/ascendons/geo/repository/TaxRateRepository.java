package com.ascendons.geo.repository;

import com.ascendons.geo.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {

    List<TaxRate> findByCountryCodeAndIsActiveTrue(String countryCode);

    List<TaxRate> findByProductIdAndCountryCodeAndStateCodeAndIsActiveTrue(UUID productId, String countryCode,
            String stateCode);

    List<TaxRate> findByProductIdIsNullAndCountryCodeAndStateCodeAndIsActiveTrue(String countryCode, String stateCode);

    List<TaxRate> findByProductId(UUID productId);
}
