package com.ascendons.feature.repository;

import com.ascendons.feature.entity.FeaturedProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FeaturedProductRepository extends JpaRepository<FeaturedProduct, UUID> {
    List<FeaturedProduct> findByFeatureSectionIdOrderByDisplayOrderAsc(UUID featureSectionId);

    @Query("SELECT fp FROM FeaturedProduct fp WHERE fp.featureSection.id = :sectionId " +
           "AND fp.isActive = true " +
           "AND (fp.startsAt IS NULL OR fp.startsAt <= :now) " +
           "AND (fp.endsAt IS NULL OR fp.endsAt >= :now) " +
           "ORDER BY fp.displayOrder ASC")
    List<FeaturedProduct> findActiveBySection(@Param("sectionId") UUID sectionId, @Param("now") OffsetDateTime now);
}
