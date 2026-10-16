package com.ascendons.razorpay.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
@RequiredArgsConstructor
public class RazorpayConfig {

    private final RazorpayProperties props;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        String keyId = props.getActiveKeyId();
        String keySecret = props.getActiveKeySecret();
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            log.error("⚠️  Razorpay API keys are not configured (testMode={}). " +
                      "Payments will fail. Set {} and {} environment variables.",
                    props.isTestMode(),
                    props.isTestMode() ? "RZP_TEST_KEY_ID" : "RZP_KEY_ID",
                    props.isTestMode() ? "RZP_TEST_KEY_SECRET" : "RZP_KEY_SECRET");
        } else {
            log.info("Initializing Razorpay client with key: {}*** (testMode={})",
                    keyId.substring(0, Math.min(keyId.length(), 10)), props.isTestMode());
        }
        return new RazorpayClient(keyId != null ? keyId : "", keySecret != null ? keySecret : "");
    }
}