package com.ascendons.media.asset;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class MediaAssetResponse {
    private UUID id;
    private String type;
    private String placement;
    private String imageUrl;
    private String title;
    private String subtitle;
    private String linkUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private OffsetDateTime startsAt;
    private OffsetDateTime endsAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
