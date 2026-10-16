package com.ascendons.order.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID orderId;
    private String provider;
    private String method;
    private String status;
    private BigDecimal amount;
    private String currency;
    private String providerOrderId;
    private String providerPaymentId;
    private String failureReason;
    private OffsetDateTime paidAt;
    private OffsetDateTime createdAt;
}
