package com.ascendons.cart.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CartItemResponse {
    private UUID id;
    private UUID productId;
    private UUID productVariantId;
    private UUID categoryId;
    private String sku;
    private String productName;
    private String packaging;
    private String imageUrl;
    private BigDecimal price;
    private Integer quantity;
    // Shipping weight/dimensions (from ProductVariant)
    private Double weightKg;
    private Double lengthMm;
    private Double breadthMm;
    private Double heightMm;
    private Integer unitsPerBox;
}
