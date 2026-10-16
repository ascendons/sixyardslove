package com.ascendons.catalog.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String productName;
    private String description;
    private UUID categoryId;
    private String categoryName;
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
    private List<ProductVariantResponse> variants;
    private List<ProductImageResponse> images;
    private List<String> imageUrls;
    private OffsetDateTime createdAt;
}
