package com.ascendons.inventory.service;

import com.ascendons.catalog.entity.ProductVariant;
import com.ascendons.catalog.repository.ProductVariantRepository;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.inventory.dto.AdjustStockRequest;
import com.ascendons.inventory.dto.InventoryMovementResponse;
import com.ascendons.inventory.dto.InventoryResponse;
import com.ascendons.inventory.entity.Inventory;
import com.ascendons.inventory.entity.InventoryMovement;
import com.ascendons.inventory.mapper.InventoryMapper;
import com.ascendons.inventory.mapper.InventoryMovementMapper;
import com.ascendons.inventory.repository.InventoryMovementRepository;
import com.ascendons.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryMapper inventoryMapper;
    private final InventoryMovementMapper movementMapper;

    public Page<InventoryResponse> getAllInventory(Pageable pageable) {
        return inventoryRepository.findAllWithDetails(pageable)
                .map(inventoryMapper::toResponse);
    }

    public InventoryResponse getInventoryByVariant(UUID productVariantId) {
        Inventory inventory = inventoryRepository.findById(productVariantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productVariantId", productVariantId));
        return inventoryMapper.toResponse(inventory);
    }

    @Transactional
    public InventoryResponse adjustStock(AdjustStockRequest request) {
        ProductVariant variant = variantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", request.getProductVariantId()));

        Inventory inventory = inventoryRepository.findById(request.getProductVariantId())
                .orElseGet(() -> {
                    Inventory newInv = Inventory.builder()
                            .productVariantId(variant.getId())
                            .productVariant(variant)
                            .quantity(0)
                            .build();
                    return inventoryRepository.save(newInv);
                });

        inventory.setQuantity(inventory.getQuantity() + request.getChangeQty());
        inventory = inventoryRepository.save(inventory);

        InventoryMovement movement = InventoryMovement.builder()
                .productVariant(variant)
                .changeQty(request.getChangeQty())
                .reason(request.getReason())
                .build();
        movementRepository.save(movement);

        return inventoryMapper.toResponse(inventory);
    }

    public List<InventoryMovementResponse> getMovements(UUID productVariantId) {
        return movementRepository.findByProductVariantId(productVariantId).stream()
                .map(movementMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void syncInventory() {
        List<ProductVariant> variants = variantRepository.findAll();
        for (ProductVariant variant : variants) {
            if (!inventoryRepository.existsById(variant.getId())) {
                Inventory inventory = Inventory.builder()
                        .productVariant(variant)
                        .quantity(0)
                        .build();
                inventoryRepository.save(inventory);
            }
        }
    }

    public List<UUID> getMissingInventory() {
        List<UUID> variantIds = variantRepository.findAll().stream()
                .map(ProductVariant::getId)
                .collect(Collectors.toList());
        List<UUID> inventoryIds = inventoryRepository.findAll().stream()
                .map(Inventory::getProductVariantId)
                .collect(Collectors.toList());

        variantIds.removeAll(inventoryIds);
        return variantIds;
    }
}
