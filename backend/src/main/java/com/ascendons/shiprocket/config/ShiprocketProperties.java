package com.ascendons.shiprocket.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.shiprocket")
@Getter
@Setter
public class ShiprocketProperties {
    private String email;
    private String password;
    private String apiKey;
    private String baseUrl = "https://apiv2.shiprocket.in/v1/external";
    private String channelId;
    private String pickupLocation = "Primary";
    private String pickupPostcode = "400001";
    private double defaultLength = 10;
    private double defaultBreadth = 10;
    private double defaultHeight = 10;
    private double defaultWeight = 0.5;
}
