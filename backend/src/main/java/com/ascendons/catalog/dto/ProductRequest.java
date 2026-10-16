package com.ascendons.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String productName;
    private String description;
    @NotNull(message = "Category ID is required")
    private UUID categoryId;
    private String productCode;
    private String subCategory;
    private String unit;
    private String location;
    private String monthlyProductionCapacity;
    private String producedBy;
    private Boolean returnApplicable;
    private String returnWindow;
    private String tax;
    private String hsn;
    private Boolean featured;
    private String leadTime;
    private String competitiveAdvantage;
    private String benefits;
    private String howToUse;
    private Boolean isActive;
    private String shiprocketPickupLocation;
    @Valid
    private List<ProductVariantRequest> variants;
    @Valid
    private List<ProductImageRequest> images;
}
