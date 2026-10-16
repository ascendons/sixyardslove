package com.ascendons.shipping.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackagingBoxRequest {
    private UUID id;
    @NotBlank(message = "Name is required")
    private String name;
    @NotNull(message = "Length is required")
    @Positive(message = "Length must be positive")
    private Double lengthCm;
    @NotNull(message = "Breadth is required")
    @Positive(message = "Breadth must be positive")
    private Double breadthCm;
    @NotNull(message = "Height is required")
    @Positive(message = "Height must be positive")
    private Double heightCm;
    @NotNull(message = "Max weight is required")
    @Positive(message = "Max weight must be positive")
    private Double maxWeightKg;
    private Boolean isActive;
}