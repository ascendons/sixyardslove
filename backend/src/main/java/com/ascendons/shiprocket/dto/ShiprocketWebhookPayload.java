package com.ascendons.shiprocket.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShiprocketWebhookPayload {

    @JsonProperty("awb")
    private String awb;

    // The order_id we sent to Shiprocket (format: "SYL-<uuid>")
    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("shipment_id")
    private Long shipmentId;

    @JsonProperty("current_status")
    private String currentStatus;

    // Estimated time of delivery
    @JsonProperty("etd")
    private String etd;

    @JsonProperty("courier_name")
    private String courierName;
}
