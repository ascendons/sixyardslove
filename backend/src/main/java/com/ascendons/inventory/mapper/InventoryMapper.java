package com.ascendons.inventory.mapper;

import com.ascendons.inventory.dto.InventoryResponse;
import com.ascendons.inventory.entity.Inventory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InventoryMapper {
    @Mapping(target = "productVariantId", source = "productVariantId")
    @Mapping(target = "sku", source = "productVariant.sku")
    @Mapping(target = "skuCode", source = "productVariant.sku")
    @Mapping(target = "productCode", source = "productVariant.product.productCode")
    @Mapping(target = "productName", source = "productVariant.product.name")
    @Mapping(target = "unit", source = "productVariant.product.unit")
    @Mapping(target = "stockLevel", source = "quantity")
    @Mapping(target = "status", expression = "java(inventory.getQuantity() > 100 ? \"In Stock\" : (inventory.getQuantity() > 0 ? \"Low Stock\" : \"Out of Stock\"))")
    InventoryResponse toResponse(Inventory inventory);
}
