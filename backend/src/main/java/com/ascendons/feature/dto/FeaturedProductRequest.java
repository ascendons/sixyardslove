package com.ascendons.feature.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeaturedProductRequest {
    @NotNull(message = "Feature section ID is required")
    private UUID featureSectionId;
    @NotNull(message = "Product ID is required")
    private UUID productId;
    private Integer displayOrder;
    private OffsetDateTime startsAt;
    private OffsetDateTime endsAt;
    private Boolean isActive;
}
