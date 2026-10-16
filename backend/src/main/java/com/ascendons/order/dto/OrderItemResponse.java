package com.ascendons.order.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private UUID id;
    private UUID productVariantId;
    private UUID productId;
    private UUID categoryId;
    private String sku;
    private String skuCode;
    private String productName;
    private String hsn;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
}
