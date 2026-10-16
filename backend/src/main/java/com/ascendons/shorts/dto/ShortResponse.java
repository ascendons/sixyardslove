package com.ascendons.shorts.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record ShortResponse(
        UUID id,
        String fileUrl,
        String caption,
        String socialUrl,
        Map<String, Object> metadata,
        Boolean isActive,
        Integer displayOrder,
        OffsetDateTime uploadedAt,
        OffsetDateTime createdAt
) {}
