package com.ascendons.catalog.dto;

import lombok.*;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductImageResponse {
    private UUID id;
    private UUID productId;
    private String imageUrl;
    private Boolean isPrimary;
}
