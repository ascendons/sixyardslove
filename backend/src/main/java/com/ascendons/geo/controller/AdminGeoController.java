package com.ascendons.geo.controller;

import com.ascendons.catalog.entity.Product;
import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.geo.dto.CurrencyResponse;
import com.ascendons.geo.dto.TaxRateRequest;
import com.ascendons.geo.dto.TaxRateResponse;
import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.entity.TaxRate;
import com.ascendons.geo.repository.CurrencyRepository;
import com.ascendons.geo.repository.TaxRateRepository;
import com.ascendons.geo.service.CurrencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/geo")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin Geo Management", description = "Currency and Tax management for admins")
public class AdminGeoController {

    private final TaxRateRepository taxRateRepository;
    private final ProductRepository productRepository;
    private final CurrencyRepository currencyRepository;
    private final CurrencyService currencyService;

    // Tax Management
    @GetMapping("/tax")
    @Operation(summary = "List all tax rates (admin)")
    public ResponseEntity<List<TaxRateResponse>> listAllTaxRates() {
        List<TaxRateResponse> rates = taxRateRepository.findAll().stream()
                .map(this::toTaxResponse)
                .toList();
        return ResponseEntity.ok(rates);
    }

    @PostMapping("/tax")
    @Operation(summary = "Create a tax rate (admin)")
    public ResponseEntity<TaxRateResponse> createTaxRate(@RequestBody @Valid TaxRateRequest request) {
        Product product = resolveProduct(request.getProductId());
        TaxRate taxRate = TaxRate.builder()
                .product(product)
                .countryCode(request.getCountryCode())
                .name(request.getName())
                .rate(request.getRate())
                .build();
        taxRate = taxRateRepository.save(taxRate);
        return ResponseEntity.ok(toTaxResponse(taxRate));
    }

    @PutMapping("/tax/{id}")
    @Operation(summary = "Update a tax rate (admin)")
    public ResponseEntity<TaxRateResponse> updateTaxRate(@PathVariable UUID id, @RequestBody @Valid TaxRateRequest request) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaxRate", "id", id));
        Product product = resolveProduct(request.getProductId());
        taxRate.setProduct(product);
        taxRate.setCountryCode(request.getCountryCode());
        taxRate.setName(request.getName());
        taxRate.setRate(request.getRate());
        taxRate = taxRateRepository.save(taxRate);
        return ResponseEntity.ok(toTaxResponse(taxRate));
    }

    @DeleteMapping("/tax/{id}")
    @Operation(summary = "Delete a tax rate (admin)")
    public ResponseEntity<Void> deleteTaxRate(@PathVariable UUID id) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaxRate", "id", id));
        taxRateRepository.delete(taxRate);
        return ResponseEntity.noContent().build();
    }

    // Currency Management
    @PutMapping("/currencies/{code}")
    @Operation(summary = "Update a currency's exchange rate (admin)")
    public ResponseEntity<CurrencyResponse> updateCurrency(
            @PathVariable String code,
            @RequestBody @Valid CurrencyResponse request) {
        Currency currency = currencyService.getCurrencyByCode(code);
        if (request.getExchangeRate() != null) {
            currency.setExchangeRate(request.getExchangeRate());
        }
        if (request.getName() != null) {
            currency.setName(request.getName());
        }
        if (request.getSymbol() != null) {
            currency.setSymbol(request.getSymbol());
        }
        currency = currencyRepository.save(currency);
        return ResponseEntity.ok(currencyService.toResponse(currency));
    }

    private Product resolveProduct(UUID productId) {
        if (productId == null) return null;
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private TaxRateResponse toTaxResponse(TaxRate taxRate) {
        return TaxRateResponse.builder()
                .id(taxRate.getId())
                .productId(taxRate.getProduct() != null ? taxRate.getProduct().getId() : null)
                .countryCode(taxRate.getCountryCode())
                .name(taxRate.getName())
                .rate(taxRate.getRate())
                .isActive(taxRate.getIsActive())
                .build();
    }
}
