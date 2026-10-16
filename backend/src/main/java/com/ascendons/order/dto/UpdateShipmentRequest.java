package com.ascendons.order.dto;

import com.ascendons.order.entity.ShipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
public class UpdateShipmentRequest {
    @NotBlank(message = "Carrier is required")
    private String carrier;

    @NotBlank(message = "Tracking number is required")
    private String trackingNumber;

    @NotNull(message = "Status cannot be null")
    private ShipmentStatus status;

    private OffsetDateTime estimatedDelivery;
}
