package com.ascendons.catalog.controller;

import com.ascendons.catalog.dto.ProductVariantResponse;
import com.ascendons.catalog.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/variants")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService variantService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductVariantResponse>> getByProduct(@PathVariable UUID productId) {
        return ResponseEntity.ok(variantService.getVariantsByProduct(productId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductVariantResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(variantService.getVariantById(id));
    }
}
