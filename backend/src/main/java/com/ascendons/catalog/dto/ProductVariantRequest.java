package com.ascendons.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantRequest {
    private UUID productId;
    @NotBlank(message = "SKU is required")
    private String sku;
    @PositiveOrZero(message = "Price must be zero or positive")
    private BigDecimal sellingPrice;
    private String packaging;
    @PositiveOrZero(message = "Box length must be zero or positive")
    private Double lengthMm;
    @PositiveOrZero(message = "Box breadth must be zero or positive")
    private Double breadthMm;
    @PositiveOrZero(message = "Box height must be zero or positive")
    private Double heightMm;
    @PositiveOrZero(message = "Units per box must be zero or positive")
    private Integer unitsPerBox;
    @PositiveOrZero(message = "Weight must be zero or positive")
    private Double weightKg;
    private BigDecimal mrp;
    private BigDecimal bulkOrderPrice;
    private Integer moq;
    private BigDecimal cogs;
    private Boolean isActive;
}
