package com.ascendons.catalog.controller;

import com.ascendons.catalog.dto.ProductImageResponse;
import com.ascendons.catalog.service.ProductImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-images")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService imageService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductImageResponse>> getByProduct(@PathVariable UUID productId) {
        return ResponseEntity.ok(imageService.getImagesByProduct(productId));
    }
}
