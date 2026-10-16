package com.ascendons.catalog.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
    private UUID parentId;
    private Boolean isActive;
    private String imageUrl;
    private List<CategoryResponse> children;
}
