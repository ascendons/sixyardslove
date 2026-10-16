package com.ascendons.shiprocket;

import com.ascendons.geo.filter.GeoLocationFilter;
import com.ascendons.security.JwtAuthenticationFilter;
import com.ascendons.shiprocket.controller.ShiprocketWebhookController;
import com.ascendons.shiprocket.service.ShiprocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Webhook controller tests WITH a webhook secret configured.
 *
 * Valid HMAC-SHA256 → 200; missing or wrong HMAC → 401.
 * Counterpart: {@link ShiprocketWebhookControllerTest} for the no-secret path.
 */
@WebMvcTest(
        controllers = ShiprocketWebhookController.class,
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
        },
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = { GeoLocationFilter.class, JwtAuthenticationFilter.class }
        )
)
@TestPropertySource(properties = "app.shiprocket.webhook-secret=test-shiprocket-secret")
class ShiprocketWebhookControllerSecretTest {

    private static final String ENDPOINT = "/api/webhooks/fulfillment";
    private static final String SECRET   = "test-shiprocket-secret";

    private static final String PAYLOAD = """
            {
              "order_id": "SYL-550e8400-e29b-41d4-a716-446655440000",
              "awb": "1234567890",
              "current_status": "Delivered",
              "courier_name": "Delhivery"
            }
            """;

    @Autowired  MockMvc mockMvc;
    @MockBean   ShiprocketService shiprocketService;
    @SpyBean    ObjectMapper objectMapper;

    @Test
    void valid_hmac_returns_200() throws Exception {
        String sig = hmacSha256(PAYLOAD, SECRET);

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Shiprocket-Hmac-Sha256", sig)
                        .content(PAYLOAD))
                .andExpect(status().isOk());
    }

    @Test
    void missing_hmac_header_returns_401() throws Exception {
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(shiprocketService);
    }

    @Test
    void bad_hmac_returns_401() throws Exception {
        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Shiprocket-Hmac-Sha256", "0000000000000000")
                        .content(PAYLOAD))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(shiprocketService);
    }

    private static String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }
}
