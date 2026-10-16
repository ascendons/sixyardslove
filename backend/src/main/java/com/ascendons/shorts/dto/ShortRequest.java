package com.ascendons.shorts.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record ShortRequest(
        @NotBlank String fileUrl,
        String caption,
        String socialUrl,
        Map<String, Object> metadata,
        Boolean isActive,
        Integer displayOrder
) {}
