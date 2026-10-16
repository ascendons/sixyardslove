package com.ascendons.order.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackedItemResponse {
    private UUID variantId;
    private String sku;
    private String productName;
    private Integer quantity;
    private Double itemLengthMm;
    private Double itemBreadthMm;
    private Double itemHeightMm;
    private Double itemWeightKg;
}