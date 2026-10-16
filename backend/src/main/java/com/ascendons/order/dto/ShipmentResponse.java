package com.ascendons.order.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private UUID id;
    private UUID orderId;
    private String carrier;
    private String trackingNumber;
    private String status;
    private Long shiprocketOrderId;
    private Long shiprocketShipmentId;
    private Double weightKg;
    private Double lengthCm;
    private Double breadthCm;
    private Double heightCm;
    private OffsetDateTime estimatedDelivery;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
