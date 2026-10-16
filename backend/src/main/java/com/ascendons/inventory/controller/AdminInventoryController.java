package com.ascendons.inventory.controller;

import com.ascendons.inventory.dto.AdjustStockRequest;
import com.ascendons.inventory.dto.InventoryMovementResponse;
import com.ascendons.inventory.dto.InventoryResponse;
import com.ascendons.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/inventory")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<Page<InventoryResponse>> getAll(Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getAllInventory(pageable));
    }

    @GetMapping("/{productVariantId}")
    public ResponseEntity<InventoryResponse> getByVariant(@PathVariable UUID productVariantId) {
        return ResponseEntity.ok(inventoryService.getInventoryByVariant(productVariantId));
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryResponse> adjustStock(@Valid @RequestBody AdjustStockRequest request) {
        return ResponseEntity.ok(inventoryService.adjustStock(request));
    }

    @GetMapping("/{productVariantId}/movements")
    public ResponseEntity<List<InventoryMovementResponse>> getMovements(@PathVariable UUID productVariantId) {
        return ResponseEntity.ok(inventoryService.getMovements(productVariantId));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> syncInventory() {
        inventoryService.syncInventory();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/missing")
    public ResponseEntity<List<UUID>> getMissingInventory() {
        return ResponseEntity.ok(inventoryService.getMissingInventory());
    }
}
