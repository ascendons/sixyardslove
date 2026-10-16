package com.ascendons.shiprocket.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShiprocketTrackResponse {

    @JsonProperty("tracking_data")
    private TrackingData trackingData;

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrackingData {
        @JsonProperty("track_status")
        private Integer trackStatus;

        @JsonProperty("shipment_track")
        private List<ShipmentTrack> shipmentTrack;

        @JsonProperty("shipment_track_activities")
        private List<TrackActivity> shipmentTrackActivities;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ShipmentTrack {
        @JsonProperty("id")
        private Long id;

        @JsonProperty("awb_code")
        private String awbCode;

        @JsonProperty("current_status")
        private String currentStatus;

        @JsonProperty("courier_name")
        private String courierName;

        @JsonProperty("etd")
        private String etd;

        @JsonProperty("delivered_date")
        private String deliveredDate;

        @JsonProperty("origin")
        private String origin;

        @JsonProperty("destination")
        private String destination;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrackActivity {
        @JsonProperty("date")
        private String date;

        @JsonProperty("activity")
        private String activity;

        @JsonProperty("location")
        private String location;

        @JsonProperty("sr-status")
        private String srStatus;
    }
}
