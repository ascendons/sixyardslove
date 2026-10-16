package com.ascendons.feature.repository;

import com.ascendons.feature.entity.FeatureSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface FeatureSectionRepository extends JpaRepository<FeatureSection, UUID> {
    List<FeatureSection> findByIsActiveTrue();
}
