package com.ascendons.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AdjustStockRequest {
    @NotNull(message = "Product variant ID is required")
    private UUID productVariantId;
    @NotNull(message = "Quantity change is required")
    private Integer changeQty;
    private String reason;
}
