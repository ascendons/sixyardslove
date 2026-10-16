package com.ascendons.coupon.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CartItemDTO {
    private UUID productId;
    private UUID variantId;
    private UUID categoryId;
    private String sku;
    private BigDecimal price;
    private Integer quantity;
}
