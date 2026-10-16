package com.ascendons.order.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class OrderTrackingResponse {

    private String awb;
    private String carrier;
    private String trackingUrl;
    private String internalStatus;
    private String etd;
    private List<Activity> activities;

    @Getter
    @Builder
    public static class Activity {
        private String date;
        private String description;
        private String location;
    }
}
