package com.ascendons.shipping.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackagingBoxResponse {
    private UUID id;
    private String name;
    private Double lengthCm;
    private Double breadthCm;
    private Double heightCm;
    private Double maxWeightKg;
    private Boolean isActive;
    private Double volumeCm3;
}