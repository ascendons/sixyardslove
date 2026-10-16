package com.ascendons.media.asset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class MediaAssetRequest {

    @NotBlank
    private String type;

    @NotBlank
    private String placement;

    @NotBlank
    @Pattern(regexp = "^(https?://.+|data:[^;]+;base64,.+|/[^\\s]*)$",
            message = "imageUrl must be a valid URL (http/https/data URI/absolute path)")
    private String imageUrl;

    private String title;
    private String subtitle;

    @Pattern(regexp = "^$|^(https?://.+|/.+|#.+|[^\\s]+)$",
            message = "linkUrl must be a valid URL (http/https/absolute path/relative path/anchor)")
    private String linkUrl;

    private Integer displayOrder;
    private Boolean isActive;
    private OffsetDateTime startsAt;
    private OffsetDateTime endsAt;
}
