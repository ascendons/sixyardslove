package com.ascendons.geo.controller;

import com.ascendons.geo.context.GeoContext;
import com.ascendons.geo.dto.GeoDetectResponse;
import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.service.CurrencyService;
import com.ascendons.geo.service.TaxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
@Tag(name = "Geolocation", description = "IP-based geolocation detection")
public class GeoController {

    private final GeoContext geoContext;
    private final CurrencyService currencyService;
    private final TaxService taxService;

    @GetMapping("/detect")
    @Operation(summary = "Detect caller's country, currency, and tax rate from IP")
    public ResponseEntity<GeoDetectResponse> detect() {
        String countryCode = geoContext.getCountryCode();

        Currency currency;
        try {
            currency = currencyService.getCurrencyForCountry(countryCode);
        } catch (Exception e) {
            currency = currencyService.getBaseCurrency();
        }

        BigDecimal taxRate = taxService.getEffectiveTaxRate(countryCode);

        GeoDetectResponse response = GeoDetectResponse.builder()
                .countryCode(countryCode)
                .countryName(geoContext.getCountryName())
                .currencyCode(currency.getCode())
                .currencySymbol(currency.getSymbol())
                .taxRate(taxRate)
                .build();

        return ResponseEntity.ok(response);
    }
}
