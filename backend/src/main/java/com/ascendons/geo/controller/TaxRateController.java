package com.ascendons.geo.controller;

import com.ascendons.geo.dto.TaxBreakdown;
import com.ascendons.geo.service.TaxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
@Tag(name = "Tax Rates", description = "Product + country tax rate management")
public class TaxRateController {

    private final TaxService taxService;

    @GetMapping("/calculate")
    @Operation(summary = "Calculate tax for a given country, amount, and optional product")
    public ResponseEntity<TaxBreakdown> calculateTax(
            @RequestParam String country,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) UUID productId) {
        return ResponseEntity.ok(taxService.calculateTax(productId, country, amount));
    }
}
