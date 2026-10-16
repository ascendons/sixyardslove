package com.ascendons.catalog.controller;

import com.ascendons.catalog.dto.*;
import com.ascendons.catalog.service.ProductImageService;
import com.ascendons.catalog.service.ProductService;
import com.ascendons.catalog.service.ProductVariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/products")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;
    private final ProductVariantService productVariantService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProductsForAdmin());
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<ProductResponse>> createProductsBulk(@Valid @RequestBody List<ProductRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProductsBulk(requests));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/featured")
    public ResponseEntity<Void> toggleFeatured(@PathVariable UUID id) {
        productService.toggleFeatured(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/pickup-location")
    public ResponseEntity<ProductResponse> updatePickupLocation(
            @PathVariable UUID id,
            @RequestParam String location) {
        return ResponseEntity.ok(productService.updatePickupLocation(id, location));
    }

    // Product Images
    @PostMapping("/images")
    public ResponseEntity<ProductImageResponse> addImage(@Valid @RequestBody ProductImageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productImageService.addImage(request));
    }

    @DeleteMapping("/images/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID id) {
        productImageService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }

    // Product Variants
    @PostMapping("/variants")
    public ResponseEntity<ProductVariantResponse> createVariant(@Valid @RequestBody ProductVariantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productVariantService.createVariant(request));
    }

    @PutMapping("/variants/{id}")
    public ResponseEntity<ProductVariantResponse> updateVariant(
            @PathVariable UUID id,
            @Valid @RequestBody ProductVariantRequest request) {
        return ResponseEntity.ok(productVariantService.updateVariant(id, request));
    }

    @DeleteMapping("/variants/{id}")
    public ResponseEntity<Void> deleteVariant(@PathVariable UUID id) {
        productVariantService.deleteVariant(id);
        return ResponseEntity.noContent().build();
    }
}
