package com.ascendons.feature.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeatureSectionResponse {
    private UUID id;
    private String name;
    private String description;
    private String imageUrl;
    private Boolean isActive;
    private List<FeaturedProductResponse> featuredProducts;
}
