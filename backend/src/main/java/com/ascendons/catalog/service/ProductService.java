package com.ascendons.catalog.service;

import com.ascendons.catalog.dto.ProductRequest;
import com.ascendons.catalog.dto.ProductResponse;
import com.ascendons.catalog.entity.Category;
import com.ascendons.catalog.entity.Product;
import com.ascendons.catalog.mapper.ProductMapper;
import com.ascendons.catalog.repository.CategoryRepository;
import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.catalog.repository.ProductVariantRepository;
import com.ascendons.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable)
                .map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProductsForAdmin() {
        return productRepository.findAll().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getFeaturedProducts(Pageable pageable) {
        return productRepository.findByFeaturedTrueAndIsActiveTrue(pageable)
                .map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategory(UUID categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable)
                .map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable)
                .map(productMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductByIdOrCode(String idOrCode) {
        Product product;
        try {
            UUID id = UUID.fromString(idOrCode);
            product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        } catch (IllegalArgumentException e) {
            product = productRepository.findByProductCodeAndIsActiveTrue(idOrCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "code", idOrCode));
        }
        return productMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product;
        if (request.getProductCode() != null) {
            java.util.Optional<Product> existing = productRepository.findByProductCodeAndIsActiveTrue(request.getProductCode());
            if (existing.isPresent()) {
                product = existing.get();
                // NO LONGER CLEARING - we will merge instead to avoid unique constraint violations with soft deletes
            } else {
                product = productMapper.toEntity(request);
            }
        } else {
            product = productMapper.toEntity(request);
        }

        // Always update fields explicitly just in case it's an existing object
        product.setName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setProductCode(request.getProductCode());
        product.setSubCategory(request.getSubCategory());
        product.setUnit(request.getUnit());
        product.setLocation(request.getLocation());
        product.setMonthlyProductionCapacity(request.getMonthlyProductionCapacity());
        product.setProducedBy(request.getProducedBy());
        product.setReturnApplicable(request.getReturnApplicable());
        product.setReturnWindow(request.getReturnWindow());
        product.setTax(request.getTax());
        product.setLeadTime(request.getLeadTime());
        product.setCompetitiveAdvantage(request.getCompetitiveAdvantage());
        if (request.getFeatured() != null) {
            product.setFeatured(request.getFeatured());
        }

        product.setCategory(category);
        if (product.getIsActive() == null) {
            product.setIsActive(true);
        }

        final Product finalProduct = product;

        // Handle variants
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            java.util.List<com.ascendons.catalog.entity.ProductVariant> variants = request.getVariants().stream()
                    .map(v -> {
                        // Check if variant with this SKU exists (even if soft-deleted)
                        com.ascendons.catalog.entity.ProductVariant variant = productVariantRepository.findBySkuIncludingDeleted(v.getSku())
                                .orElse(new com.ascendons.catalog.entity.ProductVariant());
                        
                        variant.setProduct(finalProduct);
                        variant.setSku(v.getSku());
                        variant.setPrice(v.getSellingPrice());
                        variant.setPackaging(v.getPackaging());
                        variant.setMrp(v.getMrp());
                        variant.setBulkOrderPrice(v.getBulkOrderPrice());
                        variant.setMoq(v.getMoq());
                        variant.setCogs(v.getCogs());
                        variant.setLengthMm(v.getLengthMm());
                        variant.setBreadthMm(v.getBreadthMm());
                        variant.setHeightMm(v.getHeightMm());
                        variant.setUnitsPerBox(v.getUnitsPerBox());
                        variant.setWeightKg(v.getWeightKg());
                        variant.setIsActive(v.getIsActive() != null ? v.getIsActive() : true);
                        variant.setDeletedAt(null); // Ensure it's not soft-deleted
                        return variant;
                    })
                    .collect(java.util.stream.Collectors.toList());

            // Rebuild the variants list to ensure Hibernate manages orphans if we removed any
            if (product.getVariants() != null) {
                // If it's an update, we might want to remove variants not in the new list
                // For simplicity in bulk upload, we replace the set
                product.getVariants().clear();
                product.getVariants().addAll(variants);
            } else {
                product.setVariants(variants);
            }
        }

        // Handle images
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            java.util.List<com.ascendons.catalog.entity.ProductImage> images = request.getImages().stream()
                    .map(i -> {
                        com.ascendons.catalog.entity.ProductImage image = new com.ascendons.catalog.entity.ProductImage();
                        image.setProduct(finalProduct);
                        image.setImageUrl(i.getImageUrl());
                        image.setIsPrimary(i.getIsPrimary() != null ? i.getIsPrimary() : false);
                        return image;
                    })
                    .collect(java.util.stream.Collectors.toList());
            if(product.getImages() != null) {
                product.getImages().addAll(images);
            } else {
                product.setImages(images);
            }
        }

        product = productRepository.save(product);
        return productMapper.toResponse(product);
    }

    @Transactional
    public java.util.List<ProductResponse> createProductsBulk(java.util.List<ProductRequest> requests) {
        return requests.stream()
                .map(this::createProduct)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        Product product = findById(id);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        }

        productMapper.updateEntity(request, product);
        
        final Product finalProduct = product;

        // Update variants - merge by SKU to avoid unique constraint violations with soft deletes
        if (request.getVariants() != null) {
            java.util.List<com.ascendons.catalog.entity.ProductVariant> variants = request.getVariants().stream()
                    .map(v -> {
                        // Check if variant with this SKU exists (even if soft-deleted)
                        com.ascendons.catalog.entity.ProductVariant variant = productVariantRepository.findBySkuIncludingDeleted(v.getSku())
                                .orElse(new com.ascendons.catalog.entity.ProductVariant());
                        
                        variant.setProduct(finalProduct);
                        variant.setSku(v.getSku());
                        variant.setPrice(v.getSellingPrice());
                        variant.setPackaging(v.getPackaging());
                        variant.setMrp(v.getMrp());
                        variant.setBulkOrderPrice(v.getBulkOrderPrice());
                        variant.setMoq(v.getMoq());
                        variant.setCogs(v.getCogs());
                        variant.setLengthMm(v.getLengthMm());
                        variant.setBreadthMm(v.getBreadthMm());
                        variant.setHeightMm(v.getHeightMm());
                        variant.setUnitsPerBox(v.getUnitsPerBox());
                        variant.setWeightKg(v.getWeightKg());
                        variant.setIsActive(v.getIsActive() != null ? v.getIsActive() : true);
                        variant.setDeletedAt(null); // Ensure it's not soft-deleted
                        return variant;
                    })
                    .collect(java.util.stream.Collectors.toList());

            product.getVariants().clear();
            product.getVariants().addAll(variants);
        }

        // Update images - full overwrite
        if (request.getImages() != null) {
            java.util.List<com.ascendons.catalog.entity.ProductImage> images = request.getImages().stream()
                    .map(i -> {
                        com.ascendons.catalog.entity.ProductImage image = new com.ascendons.catalog.entity.ProductImage();
                        image.setProduct(finalProduct);
                        image.setImageUrl(i.getImageUrl());
                        image.setIsPrimary(i.getIsPrimary() != null ? i.getIsPrimary() : false);
                        return image;
                    })
                    .collect(java.util.stream.Collectors.toList());
            product.getImages().clear();
            product.getImages().addAll(images);
        }

        product = productRepository.save(product);
        return productMapper.toResponse(product);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        Product product = findById(id);
        productRepository.delete(product);
    }

    @Transactional
    public void toggleFeatured(UUID id) {
        Product product = findById(id);
        boolean currentStatus = product.getFeatured() != null && product.getFeatured();
        product.setFeatured(!currentStatus);
        productRepository.save(product);
    }

    @Transactional
    public ProductResponse updatePickupLocation(UUID id, String location) {
        Product product = findById(id);
        product.setShiprocketPickupLocation(location != null && !location.isBlank() ? location : null);
        return productMapper.toResponse(productRepository.save(product));
    }

    private Product findById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
    }
}
