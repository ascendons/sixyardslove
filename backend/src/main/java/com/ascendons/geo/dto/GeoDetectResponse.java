package com.ascendons.geo.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoDetectResponse {
    private String countryCode;
    private String countryName;
    private String currencyCode;
    private String currencySymbol;
    private BigDecimal taxRate;
}
