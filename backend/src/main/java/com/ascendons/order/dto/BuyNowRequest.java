package com.ascendons.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BuyNowRequest {
    @NotNull(message = "Product Variant ID is required")
    private UUID productVariantId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Address ID is required")
    private UUID addressId;

    private Boolean isBulk;
    private String currencyCode;
    private String couponCode;
    private BigDecimal shippingFee;
}
