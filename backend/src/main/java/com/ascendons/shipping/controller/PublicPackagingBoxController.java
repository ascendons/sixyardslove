package com.ascendons.shipping.controller;

import com.ascendons.shipping.dto.PackagingBoxResponse;
import com.ascendons.shipping.service.PackagingBoxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/packaging-boxes")
@RequiredArgsConstructor
public class PublicPackagingBoxController {

    private final PackagingBoxService service;

    @GetMapping("/active")
    public ResponseEntity<List<PackagingBoxResponse>> getActiveBoxes() {
        return ResponseEntity.ok(service.getActiveBoxes());
    }
}
