package com.ascendons.shiprocket.service;

import com.ascendons.shiprocket.config.ShiprocketProperties;
import com.ascendons.shiprocket.dto.ShiprocketAuthRequest;
import com.ascendons.shiprocket.dto.ShiprocketAuthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiprocketAuthService {

    private final ShiprocketProperties props;

    // Token is valid for 10 days; refresh after 9 to avoid edge cases
    private static final Duration TOKEN_TTL = Duration.ofDays(9);

    private volatile String cachedToken;
    private volatile Instant tokenExpiry = Instant.EPOCH;

    private final RestClient restClient = RestClient.create();

    /**
     * Returns a valid Bearer token auth header.
     * Authenticates with email/password and caches the token for 9 days.
     */
    public String getAuthHeader() {
        if (cachedToken == null || Instant.now().isAfter(tokenExpiry)) {
            refreshToken();
        }
        return "Bearer " + cachedToken;
    }

    private synchronized void refreshToken() {
        // Double-checked locking: another thread may have refreshed while we waited
        if (cachedToken != null && Instant.now().isBefore(tokenExpiry)) return;

        log.info("Refreshing Shiprocket auth token with email: {}", props.getEmail());

        try {
            ShiprocketAuthResponse response = restClient.post()
                    .uri(props.getBaseUrl() + "/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ShiprocketAuthRequest(props.getEmail(), props.getPassword()))
                    .retrieve()
                    .body(ShiprocketAuthResponse.class);

            if (response == null || response.getToken() == null) {
                throw new IllegalStateException("Failed to obtain Shiprocket auth token");
            }

            cachedToken = response.getToken();
            tokenExpiry = Instant.now().plus(TOKEN_TTL);
            log.info("Shiprocket token refreshed, valid until {}", tokenExpiry);
        } catch (Exception e) {
            log.error("Failed to refresh Shiprocket token: {} - {}", e.getMessage(), e);
            throw e;
        }
    }
}
