package com.ascendons.order.mapper;

import com.ascendons.order.dto.OrderItemResponse;
import com.ascendons.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collection;

@Mapper(componentModel = "spring")
public interface OrderItemMapper {
    @Mapping(target = "productVariantId", source = "productVariant.id")
    @Mapping(target = "productId", source = "productVariant.product.id")
    @Mapping(target = "categoryId", source = "productVariant.product.category.id")
    @Mapping(target = "sku", source = "productVariant.sku")
    @Mapping(target = "skuCode", source = "productVariant.sku")
    @Mapping(target = "productName", source = "productVariant.product.name")
    @Mapping(target = "hsn", source = "productVariant.product.hsn")
    OrderItemResponse toResponse(OrderItem item);

    Collection<OrderItemResponse> toResponseList(Collection<OrderItem> items);
}
