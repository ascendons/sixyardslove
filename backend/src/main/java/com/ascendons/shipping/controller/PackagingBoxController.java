package com.ascendons.shipping.controller;

import com.ascendons.shipping.dto.PackagingBoxRequest;
import com.ascendons.shipping.dto.PackagingBoxResponse;
import com.ascendons.shipping.service.PackagingBoxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/packaging-boxes")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class PackagingBoxController {

    private final PackagingBoxService service;

    @GetMapping
    public ResponseEntity<List<PackagingBoxResponse>> getAllBoxes() {
        return ResponseEntity.ok(service.getAllBoxes());
    }

    @GetMapping("/active")
    public ResponseEntity<List<PackagingBoxResponse>> getActiveBoxes() {
        return ResponseEntity.ok(service.getActiveBoxes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackagingBoxResponse> getBox(@PathVariable UUID id) {
        return service.getBox(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PackagingBoxResponse> createBox(@Valid @RequestBody PackagingBoxRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createBox(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PackagingBoxResponse> updateBox(
            @PathVariable UUID id,
            @Valid @RequestBody PackagingBoxRequest request) {
        return service.updateBox(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBox(@PathVariable UUID id) {
        if (service.deleteBox(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}