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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Webhook controller tests with NO webhook secret configured.
 *
 * When the secret is absent, signature checking is skipped and all requests are forwarded.
 * Counterpart: {@link ShiprocketWebhookControllerSecretTest} for the authenticated path.
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
@TestPropertySource(properties = "app.shiprocket.webhook-secret=")
class ShiprocketWebhookControllerTest {

    private static final String ENDPOINT = "/api/webhooks/fulfillment";

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
    void no_secret_forwards_request_to_service_regardless_of_header() throws Exception {
        doNothing().when(shiprocketService).handleWebhook(any());

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isOk());
    }

    @Test
    void malformed_json_still_returns_200_so_shiprocket_does_not_retry() throws Exception {
        doThrow(new RuntimeException("JSON parse error"))
                .when(objectMapper).readValue(anyString(),
                        eq(com.ascendons.shiprocket.dto.ShiprocketWebhookPayload.class));

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not valid json}"))
                .andExpect(status().isOk());
    }
}
