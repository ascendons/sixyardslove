package com.ascendons.shiprocket.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/shipping")
public class ShippingRatesController {

    /**
     * Returns the flat shipping fee based on cart amount.
     *   < ₹1000  → ₹150
     *   < ₹2000  → ₹100
     *   ≥ ₹2000  → free (₹0)
     */
    @GetMapping("/rates")
    public ResponseEntity<Map<String, Object>> getRates(
            @RequestParam("cart_amount") BigDecimal cartAmount) {

        int fee;
        String label;
        if (cartAmount.compareTo(new BigDecimal("1000")) < 0) {
            fee = 150;
            label = "Standard Delivery";
        } else if (cartAmount.compareTo(new BigDecimal("2000")) < 0) {
            fee = 100;
            label = "Standard Delivery";
        } else {
            fee = 0;
            label = "Free Delivery";
        }

        log.info("Shipping rate: cartAmount={} → fee={}", cartAmount, fee);
        return ResponseEntity.ok(Map.of("fee", fee, "label", label));
    }
}
