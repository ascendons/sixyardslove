package com.ascendons.shiprocket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder(toBuilder = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShiprocketOrderRequest {

    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("order_date")
    private String orderDate;

    @JsonProperty("channel_id")
    private String channelId;

    @JsonProperty("pickup_location")
    private String pickupLocation;

    @JsonProperty("billing_customer_name")
    private String billingCustomerName;

    @JsonProperty("billing_last_name")
    private String billingLastName;

    @JsonProperty("billing_address")
    private String billingAddress;

    @JsonProperty("billing_address_2")
    private String billingAddress2;

    @JsonProperty("billing_city")
    private String billingCity;

    @JsonProperty("billing_pincode")
    private String billingPincode;

    @JsonProperty("billing_state")
    private String billingState;

    @JsonProperty("billing_country")
    private String billingCountry;

    @JsonProperty("billing_email")
    private String billingEmail;

    @JsonProperty("billing_phone")
    private String billingPhone;

    @JsonProperty("shipping_is_billing")
    private boolean shippingIsBilling;

    @JsonProperty("order_items")
    private List<OrderItemDto> orderItems;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("sub_total")
    private BigDecimal subTotal;

    @JsonProperty("total_discount")
    private BigDecimal totalDiscount;

    @JsonProperty("shipping_charges")
    private BigDecimal shippingCharges;

    @JsonProperty("length")
    private double length;

    @JsonProperty("breadth")
    private double breadth;

    @JsonProperty("height")
    private double height;

    @JsonProperty("weight")
    private double weight;

    @Getter
    @Builder
    public static class OrderItemDto {
        @JsonProperty("name")
        private String name;

        @JsonProperty("sku")
        private String sku;

        @JsonProperty("units")
        private int units;

        @JsonProperty("selling_price")
        private BigDecimal sellingPrice;

        @JsonProperty("discount")
        private BigDecimal discount;

        @JsonProperty("tax")
        private BigDecimal tax;

        @JsonProperty("hsn")
        private String hsn;
    }
}
