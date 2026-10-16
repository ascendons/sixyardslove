package com.ascendons.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressRequest {
    private String label;

    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    // country defaults to "India" in the service layer if not provided
    private String country;

    // accepts both postalCode and pincode (frontend uses pincode)
    private String postalCode;
    private String pincode;

    private String landmark;
    private String alternatePhone;
    private String addressType; // HOME, OFFICE, OTHER - stored as label if label is null

    private Boolean isDefault;
}
