package com.ascendons.user.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCustomerResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private Boolean isActive;
    private Boolean emailVerified;
    private OffsetDateTime createdAt;
    private long orderCount;
    private List<UserAddressResponse> addresses;
}
