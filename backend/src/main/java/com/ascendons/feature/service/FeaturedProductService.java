package com.ascendons.feature.service;

import com.ascendons.catalog.entity.Product;
import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.exception.ConflictException;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.feature.dto.FeaturedProductRequest;
import com.ascendons.feature.dto.FeaturedProductResponse;
import com.ascendons.feature.entity.FeatureSection;
import com.ascendons.feature.entity.FeaturedProduct;
import com.ascendons.feature.mapper.FeaturedProductMapper;
import com.ascendons.feature.repository.FeaturedProductRepository;
import com.ascendons.feature.repository.FeatureSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeaturedProductService {

    private final FeaturedProductRepository featuredProductRepository;
    private final FeatureSectionRepository sectionRepository;
    private final ProductRepository productRepository;
    private final FeaturedProductMapper featuredProductMapper;

    @Transactional(readOnly = true)
    public List<FeaturedProductResponse> getBySection(UUID sectionId) {
        return featuredProductRepository.findByFeatureSectionIdOrderByDisplayOrderAsc(sectionId).stream()
                .map(featuredProductMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeaturedProductResponse> getActiveBySectionForStorefront(UUID sectionId) {
        return featuredProductRepository.findActiveBySection(sectionId, OffsetDateTime.now()).stream()
                .map(featuredProductMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeaturedProductResponse addFeaturedProduct(FeaturedProductRequest request) {
        FeatureSection section = sectionRepository.findById(request.getFeatureSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("FeatureSection", "id", request.getFeatureSectionId()));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        FeaturedProduct fp = FeaturedProduct.builder()
                .featureSection(section)
                .product(product)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        try {
            fp = featuredProductRepository.save(fp);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Product is already featured in this section");
        }

        return featuredProductMapper.toResponse(fp);
    }

    @Transactional
    public FeaturedProductResponse updateFeaturedProduct(UUID id, FeaturedProductRequest request) {
        FeaturedProduct fp = featuredProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeaturedProduct", "id", id));

        if (request.getDisplayOrder() != null) {
            fp.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getStartsAt() != null) {
            fp.setStartsAt(request.getStartsAt());
        }
        if (request.getEndsAt() != null) {
            fp.setEndsAt(request.getEndsAt());
        }
        if (request.getIsActive() != null) {
            fp.setIsActive(request.getIsActive());
        }

        fp = featuredProductRepository.save(fp);
        return featuredProductMapper.toResponse(fp);
    }

    @Transactional
    public void removeFeaturedProduct(UUID id) {
        FeaturedProduct fp = featuredProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeaturedProduct", "id", id));
        featuredProductRepository.delete(fp);
    }
}
