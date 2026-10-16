package com.ascendons.shiprocket.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShiprocketRateResponse {

    @JsonProperty("status")
    private Integer status;

    @JsonProperty("message")
    private String message;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("data")
    private Data data;

    // ─── data object ─────────────────────────────────────────────────────────

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {

        @JsonProperty("available_courier_companies")
        private List<CourierOption> availableCourierCompanies;

        @JsonProperty("recommended_courier_company_id")
        private Integer recommendedCourierCompanyId;

        @JsonProperty("shiprocket_recommended_courier_id")
        private Integer shiprocketRecommendedCourierId;

        @JsonProperty("recommendation_level")
        private String recommendationLevel;

        @JsonProperty("is_recommendation_enabled")
        private Integer isRecommendationEnabled;
    }

    // ─── individual courier option ────────────────────────────────────────────

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CourierOption {

        @JsonProperty("courier_company_id")
        private Integer courierCompanyId;

        @JsonProperty("courier_name")
        private String courierName;

        /** Total shipping rate (integer, e.g. 123) */
        @JsonProperty("rate")
        private Integer rate;

        /** Base freight before surcharges */
        @JsonProperty("freight_charge")
        private Integer freightCharge;

        /** RTO (Return to Origin) charge */
        @JsonProperty("rto_charges")
        private Integer rtoCharges;

        /** Human-readable estimated delivery date, e.g. "Apr 11, 2026" */
        @JsonProperty("etd")
        private String etd;

        @JsonProperty("etd_hours")
        private Integer etdHours;

        /** Number of delivery days as string, e.g. "4" */
        @JsonProperty("estimated_delivery_days")
        private String estimatedDeliveryDays;

        /** 1 = COD available, 0 = not available */
        @JsonProperty("cod")
        private Integer cod;

        /** COD handling charge (integer) */
        @JsonProperty("cod_charges")
        private Integer codCharges;

        /** Actual weight used for billing */
        @JsonProperty("charge_weight")
        private Double chargeWeight;

        @JsonProperty("min_weight")
        private Double minWeight;

        /** true = surface (road), false = air */
        @JsonProperty("is_surface")
        private Boolean isSurface;

        /** 0 = not blocked, 1 = blocked */
        @JsonProperty("blocked")
        private Integer blocked;

        @JsonProperty("rating")
        private Double rating;

        @JsonProperty("zone")
        private String zone;

        @JsonProperty("city")
        private String city;

        @JsonProperty("state")
        private String state;

        @JsonProperty("postcode")
        private String postcode;

        /** Comma-separated reasons why this courier is not recommended */
        @JsonProperty("reason")
        private String reason;

        @JsonProperty("realtime_tracking")
        private String realtimeTracking;

        @JsonProperty("pod_available")
        private String podAvailable;

        @JsonProperty("call_before_delivery")
        private String callBeforeDelivery;

        @JsonProperty("suppress_date")
        private String suppressDate;
    }
}
