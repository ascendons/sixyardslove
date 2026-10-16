package com.ascendons.review.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private String userName;
    private UUID productId;
    private Integer rating;
    private String comment;
    private OffsetDateTime createdAt;
}
