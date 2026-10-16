package com.ascendons.geo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRateRequest {
    private UUID productId;

    @NotBlank(message = "Country code is required")
    private String countryCode;

    @NotBlank(message = "Tax name is required")
    private String name;

    @NotNull(message = "Tax rate is required")
    private BigDecimal rate;
}
