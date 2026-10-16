package com.ascendons.shiprocket.controller;

import com.ascendons.shiprocket.dto.ShiprocketPickupAddressesResponse;
import com.ascendons.shiprocket.dto.ShiprocketRateResponse;
import com.ascendons.shiprocket.dto.ShiprocketTrackResponse;
import com.ascendons.shiprocket.service.ShiprocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/admin/shiprocket")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class ShiprocketAdminController {

    private final ShiprocketService shiprocketService;

    /**
     * GET /admin/shiprocket/rates
     * Get available couriers and their shipping rates between two pincodes.
     * Params: pickup_postcode, delivery_postcode, weight (kg), cod (0 or 1)
     */
    @GetMapping("/rates")
    public ResponseEntity<?> getShippingRates(
            @RequestParam("pickup_postcode") String pickupPostcode,
            @RequestParam("delivery_postcode") String deliveryPostcode,
            @RequestParam("weight") double weight,
            @RequestParam(value = "cod", defaultValue = "0") int cod,
            @RequestParam(value = "length", defaultValue = "10") double length,
            @RequestParam(value = "breadth", defaultValue = "10") double breadth,
            @RequestParam(value = "height", defaultValue = "10") double height) {
        try {
            return ResponseEntity.ok(shiprocketService.getShippingRates(
                    pickupPostcode, deliveryPostcode, weight, cod, length, breadth, height));
        } catch (RuntimeException ex) {
            log.error("Shiprocket rates failed: {}", ex.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "shipping_rate_fetch_failed", "message", ex.getMessage()));
        }
    }

    /**
     * GET /admin/shiprocket/delivery-estimate
     * Estimate delivery date for a shipment.
     * Params: pickup_postcode, delivery_postcode, weight (kg), courier_id (optional)
     */
    @GetMapping("/delivery-estimate")
    public ResponseEntity<Map<String, Object>> getDeliveryEstimate(
            @RequestParam("pickup_postcode") String pickupPostcode,
            @RequestParam("delivery_postcode") String deliveryPostcode,
            @RequestParam("weight") double weight,
            @RequestParam(value = "courier_id", required = false) Long courierId) {
        return ResponseEntity.ok(
                shiprocketService.getEstimatedDelivery(pickupPostcode, deliveryPostcode, weight, courierId));
    }

    /**
     * GET /admin/shiprocket/orders
     * List orders from the Shiprocket account.
     * Params: page (default 1), per_page (default 20)
     */
    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> listOrders(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "per_page", defaultValue = "20") int perPage) {
        return ResponseEntity.ok(shiprocketService.listOrders(page, perPage));
    }

    /**
     * GET /admin/shiprocket/track/{awb}
     * Track a shipment by its AWB (Air Waybill) code.
     */
    @GetMapping("/track/{awb}")
    public ResponseEntity<ShiprocketTrackResponse> trackOrder(@PathVariable String awb) {
        return ResponseEntity.ok(shiprocketService.trackOrder(awb));
    }

    /**
     * POST /admin/shiprocket/ship
     * Assign a courier to a shipment and generate AWB.
     * Body: { "shipment_id": <long>, "courier_id": <long> }
     */
    @PostMapping("/ship")
    public ResponseEntity<Map<String, Object>> assignCourier(@RequestBody AssignCourierRequest request) {
        return ResponseEntity.ok(shiprocketService.assignCourier(request.shipmentId(), request.courierId()));
    }

    /**
     * POST /admin/shiprocket/schedule-pickup
     * Schedule a pickup for one or more shipments.
     * Body: { "shipment_ids": [<long>, ...] }
     */
    @PostMapping("/schedule-pickup")
    public ResponseEntity<Map<String, Object>> schedulePickup(@RequestBody SchedulePickupRequest request) {
        return ResponseEntity.ok(shiprocketService.schedulePickup(request.shipmentIds()));
    }

    /**
     * GET /admin/shiprocket/label?shipment_ids=1,2,3
     * Generate or retrieve shipping label PDF URL(s).
     */
    @GetMapping("/label")
    public ResponseEntity<Map<String, Object>> generateLabel(
            @RequestParam("shipment_ids") List<Long> shipmentIds) {
        return ResponseEntity.ok(shiprocketService.generateLabel(shipmentIds));
    }

    /**
     * POST /admin/shiprocket/cancel
     * Cancel one or more orders on Shiprocket.
     * Body: { "shiprocket_order_ids": [<long>, ...] }
     */
    @PostMapping("/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrders(@RequestBody CancelOrdersRequest request) {
        return ResponseEntity.ok(shiprocketService.cancelOrders(request.shiprocketOrderIds()));
    }

    /**
     * GET /admin/shiprocket/pickup-addresses
     * List all pickup addresses configured in the Shiprocket account.
     */
    @GetMapping("/pickup-addresses")
    public ResponseEntity<ShiprocketPickupAddressesResponse> listPickupAddresses() {
        return ResponseEntity.ok(shiprocketService.listPickupAddresses());
    }

    // -------------------------------------------------------------------------
    // Request records
    // -------------------------------------------------------------------------

    record AssignCourierRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("shipment_id") Long shipmentId,
            @com.fasterxml.jackson.annotation.JsonProperty("courier_id") Long courierId) {
    }

    record SchedulePickupRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("shipment_ids") List<Long> shipmentIds) {
    }

    record CancelOrdersRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("shiprocket_order_ids") List<Long> shiprocketOrderIds) {
    }
}
