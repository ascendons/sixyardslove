package com.ascendons.order.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PlaceOrderRequest {
    @NotNull(message = "Address ID is required")
    private UUID addressId;
    private Boolean isBulk;
    private String currencyCode;
    private String couponCode;
    private BigDecimal shippingFee;
    /** Shiprocket courier_company_id chosen by the user; optional */
    private Long preferredCourierId;
}
