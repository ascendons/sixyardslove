package com.ascendons.cart.mapper;

import com.ascendons.cart.dto.CartItemResponse;
import com.ascendons.cart.entity.CartItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CartItemMapper {
    @Mapping(target = "productId", source = "productVariant.product.id")
    @Mapping(target = "productVariantId", source = "productVariant.id")
    @Mapping(target = "categoryId", source = "productVariant.product.category.id")
    @Mapping(target = "sku", source = "productVariant.sku")
    @Mapping(target = "productName", source = "productVariant.product.name")
    @Mapping(target = "packaging", source = "productVariant.packaging")
    @Mapping(target = "imageUrl", expression = "java(getPrimaryImageUrl(item))")
    @Mapping(target = "price", expression = "java(item.getProductVariant().getEffectivePrice(item.getQuantity()))")
    @Mapping(target = "weightKg", source = "productVariant.weightKg")
    @Mapping(target = "lengthMm", source = "productVariant.lengthMm")
    @Mapping(target = "breadthMm", source = "productVariant.breadthMm")
    @Mapping(target = "heightMm", source = "productVariant.heightMm")
    @Mapping(target = "unitsPerBox", source = "productVariant.unitsPerBox")
    CartItemResponse toResponse(CartItem item);

    default String getPrimaryImageUrl(CartItem item) {
        if (item.getProductVariant().getProduct().getImages() == null || item.getProductVariant().getProduct().getImages().isEmpty()) {
            return null;
        }
        return item.getProductVariant().getProduct().getImages().stream()
                .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                .findFirst()
                .map(com.ascendons.catalog.entity.ProductImage::getImageUrl)
                .orElse(item.getProductVariant().getProduct().getImages().get(0).getImageUrl());
    }

    List<CartItemResponse> toResponseList(List<CartItem> items);
}
