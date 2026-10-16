package com.ascendons.geo.controller;

import com.ascendons.geo.dto.CurrencyResponse;
import com.ascendons.geo.service.CurrencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/currencies")
@RequiredArgsConstructor
@Tag(name = "Currencies", description = "Currency management")
public class CurrencyController {

    private final CurrencyService currencyService;

    @GetMapping
    @Operation(summary = "List all active currencies")
    public ResponseEntity<List<CurrencyResponse>> listCurrencies() {
        return ResponseEntity.ok(currencyService.getAllActiveCurrencies());
    }
}
