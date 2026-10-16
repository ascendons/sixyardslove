package com.ascendons.feature.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeatureSectionRequest {
    @NotBlank(message = "Section name is required")
    private String name;
    private String description;
    private String imageUrl;
    private Boolean isActive;
}
