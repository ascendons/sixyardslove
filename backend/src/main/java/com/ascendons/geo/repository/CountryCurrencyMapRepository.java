package com.ascendons.geo.repository;

import com.ascendons.geo.entity.CountryCurrencyMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CountryCurrencyMapRepository extends JpaRepository<CountryCurrencyMap, String> {
    Optional<CountryCurrencyMap> findByCountryCode(String countryCode);
}
