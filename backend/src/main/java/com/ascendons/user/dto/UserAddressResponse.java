package com.ascendons.user.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressResponse {
    private UUID id;
    private String label;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String pincode;       // alias for postalCode, returned for frontend compatibility
    private String addressType;   // reflected back from label or stored value
    private String landmark;
    private String alternatePhone;
    private Boolean isDefault;
}
