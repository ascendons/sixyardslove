package com.ascendons.feature.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeaturedProductResponse {
    private UUID id;
    private UUID featureSectionId;
    private UUID productId;
    private String productName;
    private String imageUrl;
    private Integer displayOrder;
    private OffsetDateTime startsAt;
    private OffsetDateTime endsAt;
    private Boolean isActive;
}
