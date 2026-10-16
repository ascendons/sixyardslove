package com.ascendons.inventory.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryMovementResponse {
    private UUID id;
    private UUID productVariantId;
    private Integer changeQty;
    private String reason;
    private OffsetDateTime createdAt;
}
