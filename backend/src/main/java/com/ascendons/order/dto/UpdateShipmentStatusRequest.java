package com.ascendons.order.dto;

import com.ascendons.order.entity.ShipmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateShipmentStatusRequest {
    @NotNull(message = "Status cannot be null")
    private ShipmentStatus status;
}
