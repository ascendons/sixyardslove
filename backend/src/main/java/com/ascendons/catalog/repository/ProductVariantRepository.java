package com.ascendons.catalog.repository;

import com.ascendons.catalog.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    List<ProductVariant> findByProductId(UUID productId);
    Optional<ProductVariant> findBySku(String sku);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM product_variants WHERE sku = :sku", nativeQuery = true)
    Optional<ProductVariant> findBySkuIncludingDeleted(String sku);

    boolean existsBySku(String sku);
}
