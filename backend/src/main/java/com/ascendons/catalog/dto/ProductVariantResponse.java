package com.ascendons.catalog.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private UUID id;
    private UUID productId;
    private String sku;
    private BigDecimal sellingPrice;
    private String packaging;
    private Double lengthMm;
    private Double breadthMm;
    private Double heightMm;
    private Integer unitsPerBox;
    private Double weightKg;
    private BigDecimal mrp;
    private BigDecimal bulkOrderPrice;
    private Integer moq;
    private BigDecimal cogs;
    private Boolean isActive;
    private Integer stockQuantity;
}
