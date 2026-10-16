package com.ascendons.order.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderBoxAssignmentResponse {
    private UUID id;
    private UUID boxId;
    private String boxName;
    private Double boxLengthCm;
    private Double boxBreadthCm;
    private Double boxHeightCm;
    private Double boxWeightKg;
    private Double totalItemsWeightKg;
    private Integer sequence;
    private List<PackedItemResponse> packedItems;
    private OffsetDateTime createdAt;
}