package com.ascendons.shiprocket.controller;

import com.ascendons.shiprocket.dto.ShiprocketWebhookPayload;
import com.ascendons.shiprocket.service.ShiprocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class ShiprocketWebhookController {

    private final ShiprocketService shiprocketService;
    private final ObjectMapper objectMapper;

    @Value("${app.shiprocket.webhook-secret:}")
    private String webhookSecret;

    @PostConstruct
    void init() {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("⚠️ app.shiprocket.webhook-secret is not configured — webhook signature verification is DISABLED. " +
                    "Set app.shiprocket.webhook-secret in production to enable verification. " +
                    "DO NOT deploy without this in production.");
        } else {
            log.info("Shiprocket webhook secret configured — signature verification enabled.");
        }
    }

    @PostMapping("/fulfillment")
    public ResponseEntity<Void> handleShiprocketWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Shiprocket-Hmac-Sha256", required = false) String signature) {

        // ── Signature validation (skipped entirely when no secret is configured) ─
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (signature == null || signature.isBlank()) {
                log.warn("Shiprocket webhook received without signature header — rejected");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            String expected = hmacSha256(rawBody, webhookSecret);
            if (!expected.equalsIgnoreCase(signature)) {
                log.warn("Shiprocket webhook HMAC mismatch — rejected");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        // ── Parse payload and process ─────────────────────────────────────────
        try {
            ShiprocketWebhookPayload payload = objectMapper.readValue(rawBody, ShiprocketWebhookPayload.class);
            shiprocketService.handleWebhook(payload);
        } catch (Exception e) {
            log.error("Error processing Shiprocket webhook: {}", e.getMessage(), e);
            // Return 200 so Shiprocket does not keep retrying on our processing errors
            // that are our fault (e.g. DB down) — transient errors will hit the retry window
        }
        return ResponseEntity.ok().build();
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}