package com.ascendons.geo.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyResponse {
    private String code;
    private String name;
    private String symbol;
    private BigDecimal exchangeRate;
    private Boolean isBase;
}
