package com.ascendons.admin.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminResponse {
    private UUID id;
    private String email;
    private OffsetDateTime createdAt;
}
