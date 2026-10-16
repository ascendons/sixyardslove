package com.ascendons.inventory.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {
    private UUID productVariantId;
    private String productCode;
    private String productName;
    private String unit;
    private String sku;
    private String skuCode;
    private Integer stockLevel;
    private String status;
    private String location;
}
