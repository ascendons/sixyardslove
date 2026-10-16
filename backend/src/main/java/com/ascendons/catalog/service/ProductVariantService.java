package com.ascendons.catalog.service;

import com.ascendons.catalog.dto.ProductVariantRequest;
import com.ascendons.catalog.dto.ProductVariantResponse;
import com.ascendons.catalog.entity.Product;
import com.ascendons.catalog.entity.ProductVariant;
import com.ascendons.catalog.mapper.ProductVariantMapper;
import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.catalog.repository.ProductVariantRepository;
import com.ascendons.exception.ConflictException;
import com.ascendons.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ProductVariantMapper variantMapper;

    public List<ProductVariantResponse> getVariantsByProduct(UUID productId) {
        return variantRepository.findByProductId(productId).stream()
                .map(variantMapper::toResponse)
                .collect(Collectors.toList());
    }

    public ProductVariantResponse getVariantById(UUID id) {
        ProductVariant variant = findById(id);
        return variantMapper.toResponse(variant);
    }

    @Transactional
    public ProductVariantResponse createVariant(ProductVariantRequest request) {
        if (variantRepository.existsBySku(request.getSku())) {
            throw new ConflictException("SKU already exists: " + request.getSku());
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        ProductVariant variant = variantMapper.toEntity(request);
        variant.setProduct(product);
        variant = variantRepository.save(variant);
        return variantMapper.toResponse(variant);
    }

    @Transactional
    public ProductVariantResponse updateVariant(UUID id, ProductVariantRequest request) {
        ProductVariant variant = findById(id);
        variantMapper.updateEntity(request, variant);
        variant = variantRepository.save(variant);
        return variantMapper.toResponse(variant);
    }

    @Transactional
    public void deleteVariant(UUID id) {
        ProductVariant variant = findById(id);
        variantRepository.delete(variant);
    }

    private ProductVariant findById(UUID id) {
        return variantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", id));
    }
}
