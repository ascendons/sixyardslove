package com.ascendons.order.mapper;

import com.ascendons.order.dto.OrderBoxAssignmentResponse;
import com.ascendons.order.dto.PackedItemResponse;
import com.ascendons.order.entity.OrderBoxAssignment;
import com.ascendons.order.entity.PackedItem;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface OrderBoxAssignmentMapper {

    OrderBoxAssignmentResponse toResponse(OrderBoxAssignment assignment);

    List<OrderBoxAssignmentResponse> toResponseList(List<OrderBoxAssignment> assignments);

    default PackedItemResponse packedItemToResponse(PackedItem item) {
        if (item == null) return null;
        return PackedItemResponse.builder()
                .variantId(item.getVariantId() != null ? UUID.fromString(item.getVariantId()) : null)
                .sku(item.getSku())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .itemLengthMm(item.getItemLengthMm())
                .itemBreadthMm(item.getItemBreadthMm())
                .itemHeightMm(item.getItemHeightMm())
                .itemWeightKg(item.getItemWeightKg())
                .build();
    }

    List<PackedItemResponse> packedItemsToResponseList(List<PackedItem> items);
}