package com.ascendons.geo.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoLocation {
    private String countryCode;
    private String countryName;
}
