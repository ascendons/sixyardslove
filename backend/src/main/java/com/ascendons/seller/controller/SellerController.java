package com.ascendons.seller.controller;

import com.ascendons.seller.dto.SellerResponse;
import com.ascendons.seller.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sellers")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;

    @GetMapping
    public ResponseEntity<List<SellerResponse>> getPublicSellers() {
        return ResponseEntity.ok(sellerService.getActiveSellers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SellerResponse> getPublicSellerById(@PathVariable UUID id) {
        return ResponseEntity.ok(sellerService.getPublicSellerById(id));
    }
}
