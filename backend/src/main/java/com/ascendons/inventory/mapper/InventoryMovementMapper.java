package com.ascendons.inventory.mapper;

import com.ascendons.inventory.dto.InventoryMovementResponse;
import com.ascendons.inventory.entity.InventoryMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InventoryMovementMapper {
    @Mapping(target = "productVariantId", source = "productVariant.id")
    InventoryMovementResponse toResponse(InventoryMovement movement);
}
