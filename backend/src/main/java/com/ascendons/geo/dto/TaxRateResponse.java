package com.ascendons.geo.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRateResponse {
    private UUID id;
    private UUID productId;
    private String countryCode;
    private String name;
    private BigDecimal rate;
    private Boolean isActive;
}
