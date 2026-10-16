package com.ascendons.feature.controller;

import com.ascendons.feature.dto.FeatureSectionRequest;
import com.ascendons.feature.dto.FeatureSectionResponse;
import com.ascendons.feature.dto.FeaturedProductRequest;
import com.ascendons.feature.dto.FeaturedProductResponse;
import com.ascendons.feature.service.FeatureSectionService;
import com.ascendons.feature.service.FeaturedProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/features")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminFeatureController {

    private final FeatureSectionService sectionService;
    private final FeaturedProductService featuredProductService;

    // Feature Sections
    @GetMapping("/sections/all")
    public ResponseEntity<List<FeatureSectionResponse>> getAllSections() {
        return ResponseEntity.ok(sectionService.getAllSections());
    }

    @PostMapping("/sections")
    public ResponseEntity<FeatureSectionResponse> createSection(@Valid @RequestBody FeatureSectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sectionService.createSection(request));
    }

    @PutMapping("/sections/{id}")
    public ResponseEntity<FeatureSectionResponse> updateSection(@PathVariable UUID id, @Valid @RequestBody FeatureSectionRequest request) {
        return ResponseEntity.ok(sectionService.updateSection(id, request));
    }

    @DeleteMapping("/sections/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable UUID id) {
        sectionService.deleteSection(id);
        return ResponseEntity.noContent().build();
    }

    // Featured Products
    @GetMapping("/products/section/{sectionId}/all")
    public ResponseEntity<List<FeaturedProductResponse>> getAllFeaturedBySection(@PathVariable UUID sectionId) {
        return ResponseEntity.ok(featuredProductService.getBySection(sectionId));
    }

    @PostMapping("/products")
    public ResponseEntity<FeaturedProductResponse> addFeaturedProduct(@Valid @RequestBody FeaturedProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(featuredProductService.addFeaturedProduct(request));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<FeaturedProductResponse> updateFeaturedProduct(@PathVariable UUID id, @Valid @RequestBody FeaturedProductRequest request) {
        return ResponseEntity.ok(featuredProductService.updateFeaturedProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> removeFeaturedProduct(@PathVariable UUID id) {
        featuredProductService.removeFeaturedProduct(id);
        return ResponseEntity.noContent().build();
    }
}
