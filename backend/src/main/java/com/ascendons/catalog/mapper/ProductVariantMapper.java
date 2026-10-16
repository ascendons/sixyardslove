package com.ascendons.catalog.mapper;

import com.ascendons.catalog.dto.ProductVariantRequest;
import com.ascendons.catalog.dto.ProductVariantResponse;
import com.ascendons.catalog.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductVariantMapper {
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "sellingPrice", source = "price")
    @Mapping(target = "stockQuantity", source = "inventory.quantity")
    @Mapping(target = "lengthMm", source = "lengthMm")
    @Mapping(target = "breadthMm", source = "breadthMm")
    @Mapping(target = "heightMm", source = "heightMm")
    @Mapping(target = "unitsPerBox", source = "unitsPerBox")
    @Mapping(target = "weightKg", source = "weightKg")
    ProductVariantResponse toResponse(ProductVariant variant);

    List<ProductVariantResponse> toResponseList(List<ProductVariant> variants);

    @Mapping(target = "price", source = "sellingPrice")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "inventory", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    ProductVariant toEntity(ProductVariantRequest request);

    @Mapping(target = "price", source = "sellingPrice")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "inventory", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(ProductVariantRequest request, @MappingTarget ProductVariant variant);
}
