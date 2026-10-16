package com.ascendons.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductImageRequest {
    // Optional when images are submitted as part of ProductRequest (service sets the product reference).
    // Required only when calling the standalone /admin/products/images endpoint.
    private UUID productId;
    @NotBlank(message = "Image URL is required")
    private String imageUrl;
    private Boolean isPrimary;
}
