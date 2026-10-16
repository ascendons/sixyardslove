package com.ascendons.razorpay.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.razorpay")
@Getter
@Setter
public class RazorpayProperties {
    private String keyId;
    private String keySecret;
    private String webhookSecret;
    private boolean testMode = true;

    private String testKeyId;
    private String testKeySecret;

    public String getActiveKeyId() {
        return testMode ? testKeyId : keyId;
    }

    public String getActiveKeySecret() {
        return testMode ? testKeySecret : keySecret;
    }
}