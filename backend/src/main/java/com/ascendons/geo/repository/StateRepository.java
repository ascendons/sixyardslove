package com.ascendons.geo.repository;

import com.ascendons.geo.entity.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StateRepository extends JpaRepository<State, UUID> {
    List<State> findByCountryCodeAndIsActiveTrue(String countryCode);

    Optional<State> findByCountryCodeAndCode(String countryCode, String code);
}
