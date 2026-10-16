package com.ascendons.feature.controller;

import com.ascendons.feature.dto.FeaturedProductResponse;
import com.ascendons.feature.service.FeaturedProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/featured/products")
@RequiredArgsConstructor
public class FeaturedProductController {

    private final FeaturedProductService featuredProductService;

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<FeaturedProductResponse>> getActiveBySection(@PathVariable UUID sectionId) {
        return ResponseEntity.ok(featuredProductService.getActiveBySectionForStorefront(sectionId));
    }
}
