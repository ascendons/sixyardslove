package com.ascendons.razorpay;

import com.ascendons.exception.BadRequestException;
import com.ascendons.geo.filter.GeoLocationFilter;
import com.ascendons.razorpay.controller.RazorpayWebhookController;
import com.ascendons.razorpay.service.RazorpayService;
import com.ascendons.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Slice test for {@link RazorpayWebhookController}.
 *
 * Security and geo filters are excluded to keep the slice minimal — they require
 * beans (JwtUtil, GeoLocationService, etc.) that are irrelevant here.
 */
@WebMvcTest(
        controllers = RazorpayWebhookController.class,
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
        },
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = { GeoLocationFilter.class, JwtAuthenticationFilter.class }
        )
)
@TestPropertySource(properties = "spring.main.allow-bean-definition-overriding=true")
class RazorpayWebhookControllerTest {

    @Autowired  private MockMvc mockMvc;
    @MockBean   private RazorpayService razorpayService;

    private static final String ENDPOINT = "/api/webhooks/razorpay";
    private static final String PAYLOAD  = """
            {
              "event": "payment.captured",
              "payload": {
                "payment": { "entity": { "id": "pay_test", "order_id": "order_test", "method": "upi" } }
              }
            }
            """;

    @Test
    void returns_200_OK_when_service_processes_successfully() throws Exception {
        doNothing().when(razorpayService).handleWebhook(any(), any());

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", "validsig")
                        .content(PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        verify(razorpayService).handleWebhook(any(), eq("validsig"));
    }

    @Test
    void returns_200_without_signature_header() throws Exception {
        doNothing().when(razorpayService).handleWebhook(any(), any());

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isOk());

        // Signature header defaults to empty string when absent
        verify(razorpayService).handleWebhook(any(), eq(""));
    }

    @Test
    void returns_400_when_service_throws_BadRequestException() throws Exception {
        doThrow(new BadRequestException("Invalid webhook signature"))
                .when(razorpayService).handleWebhook(any(), any());

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", "badsig")
                        .content(PAYLOAD))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returns_500_when_service_throws_unexpected_exception_so_razorpay_retries() throws Exception {
        doThrow(new RuntimeException("DB connection lost"))
                .when(razorpayService).handleWebhook(any(), any());

        mockMvc.perform(post(ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isInternalServerError());
    }
}
