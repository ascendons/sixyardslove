package com.ascendons.razorpay.controller;

import com.ascendons.razorpay.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/razorpay")
@RequiredArgsConstructor
@Slf4j
public class RazorpayWebhookController {

    private final RazorpayService razorpayService;

    /**
     * Razorpay webhook endpoint.
     *
     * Security: HMAC-SHA256 of raw body validated against X-Razorpay-Signature header.
     * Idempotent: events that have already been processed are silently skipped.
     * Fallback: if client-side verification failed, webhook provides the authoritative capture.
     */
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", defaultValue = "") String signature) {
        try {
            razorpayService.handleWebhook(rawPayload, signature);
            return ResponseEntity.ok("OK");
        } catch (com.ascendons.exception.BadRequestException e) {
            log.warn("Webhook rejected: {}", e.getMessage());
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            // Return 500 so Razorpay retries
            log.error("Webhook processing error — will be retried by Razorpay: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Retry later");
        }
    }
}
