package com.ascendons.geo.service;

import com.ascendons.geo.dto.TaxBreakdown;
import com.ascendons.geo.entity.TaxRate;
import com.ascendons.geo.repository.TaxRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaxService {

    private final TaxRateRepository taxRateRepository;
    @org.springframework.beans.factory.annotation.Value("${app.geo.seller-state:RJ}")
    private String sellerState;

    // Map of Indian state full names → 2-letter ISO codes for IGST/CGST routing
    private static final java.util.Map<String, String> STATE_CODE_MAP = java.util.Map.ofEntries(
        java.util.Map.entry("andhra pradesh", "AP"), java.util.Map.entry("arunachal pradesh", "AR"),
        java.util.Map.entry("assam", "AS"), java.util.Map.entry("bihar", "BR"),
        java.util.Map.entry("chhattisgarh", "CG"), java.util.Map.entry("goa", "GA"),
        java.util.Map.entry("gujarat", "GJ"), java.util.Map.entry("haryana", "HR"),
        java.util.Map.entry("himachal pradesh", "HP"), java.util.Map.entry("jharkhand", "JH"),
        java.util.Map.entry("karnataka", "KA"), java.util.Map.entry("kerala", "KL"),
        java.util.Map.entry("madhya pradesh", "MP"), java.util.Map.entry("maharashtra", "MH"),
        java.util.Map.entry("manipur", "MN"), java.util.Map.entry("meghalaya", "ML"),
        java.util.Map.entry("mizoram", "MZ"), java.util.Map.entry("nagaland", "NL"),
        java.util.Map.entry("odisha", "OD"), java.util.Map.entry("punjab", "PB"),
        java.util.Map.entry("rajasthan", "RJ"), java.util.Map.entry("sikkim", "SK"),
        java.util.Map.entry("tamil nadu", "TN"), java.util.Map.entry("telangana", "TS"),
        java.util.Map.entry("tripura", "TR"), java.util.Map.entry("uttar pradesh", "UP"),
        java.util.Map.entry("uttarakhand", "UK"), java.util.Map.entry("west bengal", "WB"),
        java.util.Map.entry("delhi", "DL"), java.util.Map.entry("jammu and kashmir", "JK"),
        java.util.Map.entry("ladakh", "LA")
    );

    private String normaliseState(String state) {
        if (state == null) return null;
        String trimmed = state.trim();
        if (trimmed.length() == 2) return trimmed.toUpperCase(); // already a code
        return STATE_CODE_MAP.getOrDefault(trimmed.toLowerCase(), trimmed.toUpperCase());
    }

    /**
     * Calculate tax for a specific product in a specific country.
     * Supports GST splitting for India.
     */
    public TaxBreakdown calculateTax(UUID productId, String countryCode, String buyerState, BigDecimal subtotal) {
        TaxRate taxRate = resolveTaxRate(productId, countryCode, buyerState);

        if (taxRate == null) {
            return TaxBreakdown.builder()
                    .taxName("None")
                    .taxRate(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .subtotal(subtotal)
                    .total(subtotal)
                    .build();
        }

        // Prices are tax-inclusive (MRP includes GST). Back-calculate:
        // taxAmount = price * rate / (100 + rate)
        BigDecimal totalTaxAmount = subtotal
                .multiply(taxRate.getRate())
                .divide(BigDecimal.valueOf(100).add(taxRate.getRate()), 2, RoundingMode.HALF_UP);

        TaxBreakdown.TaxBreakdownBuilder builder = TaxBreakdown.builder()
                .taxName(taxRate.getName())
                .taxRate(taxRate.getRate())
                .taxAmount(totalTaxAmount)
                .subtotal(subtotal.subtract(totalTaxAmount)) // taxable (pre-GST) value
                .total(subtotal);                            // total is unchanged (inclusive)

        // India-specific GST splitting
        if ("IN".equalsIgnoreCase(countryCode)) {
            String normalisedBuyer = normaliseState(buyerState);
            String normalisedSeller = normaliseState(sellerState);
            if (normalisedSeller != null && normalisedSeller.equalsIgnoreCase(normalisedBuyer)) {
                BigDecimal halfTax = totalTaxAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                builder.cgstAmount(halfTax);
                builder.sgstAmount(totalTaxAmount.subtract(halfTax)); // Ensure no rounding loss
            } else {
                builder.igstAmount(totalTaxAmount);
            }
        }

        return builder.build();
    }

    /**
     * Overload for backward compatibility (defaults to no state).
     */
    public TaxBreakdown calculateTax(UUID productId, String countryCode, BigDecimal subtotal) {
        return calculateTax(productId, countryCode, null, subtotal);
    }

    public TaxBreakdown calculateTax(String countryCode, BigDecimal subtotal) {
        return calculateTax(null, countryCode, null, subtotal);
    }

    /**
     * Resolve the applicable tax rate: product+country+state specific first, then
     * country default.
     */
    private TaxRate resolveTaxRate(UUID productId, String countryCode, String stateCode) {
        if (productId != null) {
            List<TaxRate> productRates = taxRateRepository
                    .findByProductIdAndCountryCodeAndStateCodeAndIsActiveTrue(productId, countryCode, stateCode);
            if (!productRates.isEmpty()) {
                return productRates.get(0);
            }
            // If no state-specific, fall back to country-specific for the product
            productRates = taxRateRepository
                    .findByProductIdAndCountryCodeAndStateCodeAndIsActiveTrue(productId, countryCode, null);
            if (!productRates.isEmpty()) {
                return productRates.get(0);
            }
        }

        // Fall back to country/state defaults
        List<TaxRate> defaults = taxRateRepository
                .findByProductIdIsNullAndCountryCodeAndStateCodeAndIsActiveTrue(countryCode, stateCode);
        if (defaults.isEmpty()) {
            defaults = taxRateRepository
                    .findByProductIdIsNullAndCountryCodeAndStateCodeAndIsActiveTrue(countryCode, null);
        }
        return defaults.isEmpty() ? null : defaults.get(0);
    }

    public BigDecimal getEffectiveTaxRate(UUID productId, String countryCode, String stateCode) {
        TaxRate taxRate = resolveTaxRate(productId, countryCode, stateCode);
        return taxRate != null ? taxRate.getRate() : BigDecimal.ZERO;
    }

    public BigDecimal getEffectiveTaxRate(String countryCode) {
        return getEffectiveTaxRate(null, countryCode, null);
    }
}
