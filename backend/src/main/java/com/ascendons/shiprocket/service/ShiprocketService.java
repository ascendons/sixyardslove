package com.ascendons.shiprocket.service;

import com.ascendons.email.EmailService;
import com.ascendons.inventory.entity.Inventory;
import com.ascendons.inventory.entity.InventoryMovement;
import com.ascendons.inventory.repository.InventoryMovementRepository;
import com.ascendons.inventory.repository.InventoryRepository;
import com.ascendons.order.entity.*;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.ShipmentRepository;
import com.ascendons.shipping.entity.PackagingBox;
import com.ascendons.shipping.service.PackagingBoxService;
import com.ascendons.shiprocket.config.ShiprocketProperties;
import com.ascendons.shiprocket.dto.ShiprocketOrderRequest;
import com.ascendons.shiprocket.dto.ShiprocketOrderResponse;
import com.ascendons.shiprocket.dto.ShiprocketPickupAddressesResponse;
import com.ascendons.shiprocket.dto.ShiprocketRateResponse;
import com.ascendons.shiprocket.dto.ShiprocketTrackResponse;
import com.ascendons.shiprocket.dto.ShiprocketWebhookPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiprocketService {

    private static final DateTimeFormatter SHIPROCKET_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ShiprocketProperties props;
    private final ShiprocketAuthService authService;
    private final PackagingBoxService packagingBoxService;
    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    private final RestClient restClient = RestClient.create();

    /**
     * Creates a Shiprocket order from a confirmed Six Yards Love order and persists the
     * resulting shipment (AWB + carrier). Called after payment capture.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createShiprocketOrder(Order order) {
        // Check if shipment already exists and is successfully assigned
        var existingShipment = shipmentRepository.findByOrderId(order.getId());
        if (existingShipment.isPresent()) {
            Shipment shipment = existingShipment.get();
            // Only skip if AWB is already assigned; otherwise retry the fulfillment
            if (shipment.getTrackingNumber() != null && !shipment.getTrackingNumber().isBlank()) {
                log.info("Shiprocket order already exists and AWB is assigned for order {} — skipping", order.getId());
                return;
            }
            // AWB not assigned yet; retry fulfillment with new delay
            log.info("Retrying AWB assignment for existing shipment {} (order {})", shipment.getId(), order.getId());
            try {
                Thread.sleep(5000); // Wait for Shiprocket to stabilize shipment state
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return;
            }
            double weight = shipment.getWeightKg() != null ? shipment.getWeightKg() : props.getDefaultWeight();
            autoFulfillShipment(shipment, order.getAddress().getPostalCode(), shipment.getShiprocketShipmentId(), order.getPreferredCourierId(), weight);
            return;
        }

        // Re-fetch within this transaction to ensure lazy collections (items → variants → products) are accessible
        final Order o = orderRepository.findById(order.getId())
                .orElseThrow(() -> new RuntimeException("Order not found: " + order.getId()));

        var address = o.getAddress();
        var user = o.getUser();
        String customerName = user.getFirstName() != null ? user.getFirstName() : "Customer";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        // Shiprocket requires a non-blank phone; fall back to a placeholder if the user has none
        String phone = (user.getPhone() != null && !user.getPhone().isBlank())
                ? user.getPhone() : "9876543210";
        String country = address.getCountry() != null ? address.getCountry() : "India";
        String channelId = props.getChannelId() != null && !props.getChannelId().isBlank()
                ? props.getChannelId() : null;

        // Group items by pickup location — each group becomes a separate Shiprocket order
        Map<String, List<OrderItem>> itemsByPickup = o.getItems().stream()
                .collect(Collectors.groupingBy(
                        item -> {
                            String loc = item.getProductVariant().getProduct().getShiprocketPickupLocation();
                            return (loc != null && !loc.isBlank()) ? loc : props.getPickupLocation();
                        },
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        boolean multiGroup = itemsByPickup.size() > 1;
        int groupIndex = 0;
        int successCount = 0;
        int failureCount = 0;

        for (Map.Entry<String, List<OrderItem>> entry : itemsByPickup.entrySet()) {
            groupIndex++;
            String pickupLocation = entry.getKey();
            List<OrderItem> groupItems = entry.getValue();

            // Suffix order ID only when split across multiple pickup locations
            String shiprocketOrderId = multiGroup
                    ? "SYL-" + o.getId() + "-" + groupIndex
                    : "SYL-" + o.getId();

            List<ShiprocketOrderRequest.OrderItemDto> itemDtos = groupItems.stream()
                    .map(item -> ShiprocketOrderRequest.OrderItemDto.builder()
                            .name(item.getProductVariant().getProduct().getName())
                            .sku(item.getProductVariant().getSku())
                            .units(item.getQuantity())
                            .sellingPrice(item.getPrice())
                            .discount(BigDecimal.ZERO)
                            .tax(item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO)
                            .hsn("")
                            .build())
                    .toList();

            BigDecimal groupSubtotal = groupItems.stream()
                    .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Collect all item dimensions and total weight for box selection
            List<PackagingBoxService.ItemDimensions> itemDimensions = groupItems.stream()
                    .map(item -> {
                        var variant = item.getProductVariant();
                        double w = variant.getWeightKg() != null ? variant.getWeightKg()
                                : (variant.getLengthMm() != null && variant.getBreadthMm() != null && variant.getHeightMm() != null
                                        ? (variant.getLengthMm() * variant.getBreadthMm() * variant.getHeightMm()) / 1_000_000.0 * 0.8
                                        : 0.5);
                        return new PackagingBoxService.ItemDimensions(
                                variant.getLengthMm() != null ? variant.getLengthMm() : 100,
                                variant.getBreadthMm() != null ? variant.getBreadthMm() : 100,
                                variant.getHeightMm() != null ? variant.getHeightMm() : 100,
                                w * item.getQuantity(),
                                item.getQuantity()
                        );
                    })
                    .toList();

            double totalItemWeight = itemDimensions.stream().mapToDouble(d -> d.weightKg()).sum();

            // Select the smallest box that fits all items and weight
            Optional<PackagingBox> selectedBox = packagingBoxService.selectBoxForItems(itemDimensions, totalItemWeight);

            double length, breadth, height, weight;
            if (selectedBox.isPresent()) {
                var box = selectedBox.get();
                length = box.getLengthCm();
                breadth = box.getBreadthCm();
                height = box.getHeightCm();
                weight = Math.max(0.1, totalItemWeight);
                log.info("Selected box '{}' ({}/{}cm) for {} items, total weight {}kg",
                        box.getName(), length, breadth, groupItems.size(), weight);
            } else {
                // Fallback to largest box or defaults
                length = 30; breadth = 30; height = 30; weight = Math.max(0.1, totalItemWeight);
                log.warn("No suitable box found for order {} — using fallback dimensions", shiprocketOrderId);
            }

            ShiprocketOrderRequest payload = ShiprocketOrderRequest.builder()
                    .orderId(shiprocketOrderId)
                    .orderDate(o.getCreatedAt().format(SHIPROCKET_DATE_FORMAT))
                    .channelId(channelId)
                    .pickupLocation(pickupLocation)
                    .billingCustomerName(customerName)
                    .billingLastName(lastName)
                    .billingAddress(address.getAddressLine1())
                    .billingAddress2(address.getAddressLine2() != null ? address.getAddressLine2() : "")
                    .billingCity(address.getCity())
                    .billingPincode(address.getPostalCode())
                    .billingState(address.getState())
                    .billingCountry(country)
                    .billingEmail(user.getEmail())
                    .billingPhone(phone)
                    .shippingIsBilling(true)
                    .orderItems(itemDtos)
                    .paymentMethod("Prepaid")
                    .subTotal(groupSubtotal)
                    .totalDiscount(BigDecimal.ZERO)
                    .shippingCharges(BigDecimal.ZERO)
                    .length(length)
                    .breadth(breadth)
                    .height(height)
                    .weight(weight)
                    .build();

            log.info("Shiprocket POST /orders request [orderId={}]: {}", shiprocketOrderId, toJson(payload));
            ShiprocketOrderResponse response = callShiprocketWithRetry(shiprocketOrderId, payload);
            if (response == null) {
                log.error("Shiprocket order creation failed for order {} after all retries — no shipment saved", shiprocketOrderId);
                failureCount++;
                continue;
            }

            log.info("Shiprocket POST /orders response [orderId={}]: {}", shiprocketOrderId, toJson(response));

            Shipment shipment = Shipment.builder()
                    .order(o)
                    .carrier(response.getCourierName())
                    .trackingNumber(response.getAwbCode())
                    .shiprocketOrderId(response.getOrderId())
                    .shiprocketShipmentId(response.getShipmentId())
                    .status(ShipmentStatus.LABEL_CREATED)
                    .weightKg(weight)
                    .lengthCm(length)
                    .breadthCm(breadth)
                    .heightCm(height)
                    .build();
            shipment = shipmentRepository.save(shipment);
            successCount++;

            // Automatically assign AWB and schedule pickup — alert admin on failure but do NOT
            // re-throw: the Shipment row must survive so the retry scheduler can pick it up.
            try {
                autoFulfillShipment(shipment, address.getPostalCode(), response.getShipmentId(), o.getPreferredCourierId(), weight);
            } catch (Exception awbErr) {
                log.error("autoFulfillShipment FAILED for shipment {} (order {}) — will retry automatically. Reason: {}",
                        shipment.getId(), o.getId(), awbErr.getMessage());
                try {
                    sendAdminAlert(
                            "⚠️ AWB assignment failed for order #" + shortId(o.getId()) + " — auto-retry scheduled",
                            buildShipmentFailureEmail(o, shortId(o.getId()), shipment.getId().toString(), awbErr.getMessage())
                    );
                } catch (Exception emailErr) {
                    log.warn("Admin alert email failed (non-critical): {}", emailErr.getMessage());
                }
                // Intentionally NOT re-throwing: the Shipment is persisted so the retry scheduler
                // can attempt AWB assignment again without duplicating the Shiprocket order.
            }
        }

        // Only advance order to CONFIRMED when ALL shipment groups succeeded
        if (failureCount == 0) {
            o.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(o);
            log.info("All {} Shiprocket shipment groups created for order {} — status set to CONFIRMED", successCount, o.getId());
        } else {
            log.error("Order {} has {} failed and {} successful Shiprocket shipments — NOT confirming. Manual intervention required.",
                    o.getId(), failureCount, successCount);
        }
    }

    /**
     * Processes an inbound Shiprocket webhook: updates order/shipment status and
     * restores inventory on cancellation or RTO.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleWebhook(ShiprocketWebhookPayload payload) {
        log.info("Shiprocket webhook received: orderId={}, status={}",
                payload.getOrderId(), payload.getCurrentStatus());

        // Resolve internal order from the prefixed order ID ("SYL-<uuid>")
        UUID orderId = parseOrderId(payload.getOrderId());
        if (orderId == null) {
            log.warn("Could not parse order ID from webhook payload: {}", payload.getOrderId());
            return;
        }

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            log.warn("No order found for id {}", orderId);
            return;
        }
        Order order = orderOpt.get();

        // Update shipment
        Optional<Shipment> shipmentOpt = shipmentRepository.findByOrderId(orderId);
        if (shipmentOpt.isPresent()) {
            Shipment shipment = shipmentOpt.get();
            if (payload.getAwb() != null) shipment.setTrackingNumber(payload.getAwb());
            if (payload.getCourierName() != null) shipment.setCarrier(payload.getCourierName());

            ShipmentStatus newShipmentStatus = mapToShipmentStatus(payload.getCurrentStatus());
            if (newShipmentStatus != null) shipment.setStatus(newShipmentStatus);

            if (payload.getEtd() != null) {
                try {
                    shipment.setEstimatedDelivery(
                            OffsetDateTime.parse(payload.getEtd().replace(" ", "T") + "+05:30"));
                } catch (Exception e) {
                    log.debug("Could not parse ETD '{}': {}", payload.getEtd(), e.getMessage());
                }
            }
            shipmentRepository.save(shipment);
        }

        // Update order status
        OrderStatus newOrderStatus = mapToOrderStatus(payload.getCurrentStatus());
        if (newOrderStatus != null && order.getStatus() != newOrderStatus) {
            boolean wasCancelled = newOrderStatus == OrderStatus.CANCELLED
                    && order.getStatus() != OrderStatus.CANCELLED;
            boolean wasShipped = newOrderStatus == OrderStatus.SHIPPED
                    && order.getStatus() != OrderStatus.SHIPPED;
            boolean wasDelivered = newOrderStatus == OrderStatus.DELIVERED
                    && order.getStatus() != OrderStatus.DELIVERED;

            order.setStatus(newOrderStatus);
            orderRepository.save(order);

            // Restore inventory on cancellation / RTO — flag set ONLY after restore succeeds
            if (wasCancelled && !Boolean.TRUE.equals(order.getInventoryRestored())) {
                try {
                    restoreInventory(order);
                    order.setInventoryRestored(true);
                    orderRepository.save(order);
                } catch (Exception e) {
                    log.error("Failed to restore inventory for cancelled order {}: {}",
                            order.getId(), e.getMessage(), e);
                    // Do NOT set inventoryRestored flag — retry will re-attempt restoration
                }
            }

            // Send status-change emails (best-effort)
            try {
                String customerName = order.getUser().getFirstName()
                        + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
                String email = order.getUser().getEmail();
                String orderIdStr = order.getId().toString();
                if (wasShipped) {
                    String awb = payload.getAwb();
                    String courier = payload.getCourierName();
                    emailService.sendOrderShippedEmail(email, customerName, orderIdStr, awb, courier);
                } else if (wasDelivered) {
                    emailService.sendOrderDeliveredEmail(email, customerName, orderIdStr);
                } else if (wasCancelled) {
                    emailService.sendOrderCancelledEmail(email, customerName, orderIdStr,
                            "Shipment status: " + payload.getCurrentStatus());
                }
            } catch (Exception e) {
                log.error("Failed to send status email for order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    private void restoreInventory(Order order) {
        log.info("Restoring inventory for cancelled order {}", order.getId());
        for (OrderItem item : order.getItems()) {
            UUID variantId = item.getProductVariant().getId();
            Inventory inventory = inventoryRepository.findByIdForUpdate(variantId)
                    .orElseGet(() -> {
                        Inventory newInv = Inventory.builder()
                                .productVariantId(variantId)
                                .productVariant(item.getProductVariant())
                                .quantity(0)
                                .location("Central Warehouse")
                                .build();
                        return inventoryRepository.save(newInv);
                    });
            inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);

            InventoryMovement movement = InventoryMovement.builder()
                    .productVariant(item.getProductVariant())
                    .changeQty(item.getQuantity())
                    .reason("Order cancelled (Shiprocket): " + order.getId())
                    .build();
            movementRepository.save(movement);
        }
    }

    private UUID parseOrderId(String shiprocketOrderId) {
        if (shiprocketOrderId == null) return null;
        try {
            // Format is "SYL-<uuid>" for single-location orders
            // or "SYL-<uuid>-<groupIndex>" for multi-location split orders
            String uuidPart = shiprocketOrderId.startsWith("SYL-")
                    ? shiprocketOrderId.substring("SYL-".length())
                    : shiprocketOrderId;
            // Strip trailing group suffix (e.g. "-1", "-2") so UUID.fromString doesn't fail
            if (uuidPart.length() > 36) {
                uuidPart = uuidPart.substring(0, 36);
            }
            return UUID.fromString(uuidPart);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private void sendAdminAlert(String subject, String html) {
        emailService.sendAdminAlert(subject, html);
    }

    private String shortId(UUID id) {
        return id.toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private String buildShipmentFailureEmail(Order order, String orderShortId, String shipmentId, String errorMessage) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
                  <div style="background:#dc2626;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;">⚠️ Shipment Fulfillment Failed — Action Required</h1>
                  </div>
                  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
                    <p>Shiprocket AWB assignment failed for the following order. The shipment exists but cannot be fulfilled until this is resolved.</p>
                    <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;">
                      <p style="margin:0 0 8px;"><strong>Order ID:</strong> <span style="font-family:monospace;">#%s</span></p>
                      <p style="margin:0 0 8px;"><strong>Shipment ID:</strong> <span style="font-family:monospace;">%s</span></p>
                      <p style="margin:0 0 8px;"><strong>Customer:</strong> %s (%s)</p>
                      <p style="margin:0;"><strong>Error:</strong> %s</p>
                    </div>
                    <p><strong>What to do:</strong></p>
                    <ol style="color:#555;">
                      <li>Go to Shiprocket dashboard and manually assign a courier and generate AWB for shipment ID <span style="font-family:monospace;">%s</span></li>
                      <li>Once AWB is assigned, update the shipment status via the admin panel</li>
                      <li>If Shiprocket is experiencing outages, monitor their status page and retry once services are restored</li>
                    </ol>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
                    <p style="color:#999;font-size:12px;text-align:center;">Six Yards Love Admin Notification — Do not reply</p>
                  </div>
                </body>
                </html>
                """.formatted(
                orderShortId, shipmentId,
                order.getUser().getFirstName() + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : ""),
                order.getUser().getEmail(),
                errorMessage,
                shipmentId
        );
    }

    private OrderStatus mapToOrderStatus(String shiprocketStatus) {
        if (shiprocketStatus == null) return null;
        return switch (shiprocketStatus.toLowerCase()) {
            case "pickup scheduled", "pickup queued", "pickup error", "pickup rescheduled",
                 "out for pickup" -> OrderStatus.CONFIRMED;
            case "in transit", "reached at destination hub" -> OrderStatus.SHIPPED;
            case "out for delivery" -> OrderStatus.SHIPPED;
            case "delivered" -> OrderStatus.DELIVERED;
            case "cancelled", "rto initiated", "rto delivered", "rto acknowledged" -> OrderStatus.CANCELLED;
            default -> null;
        };
    }

    // -------------------------------------------------------------------------
    // shipping_rate_calculator
    // -------------------------------------------------------------------------

    /**
     * Fetches available courier options and their rates for a given route and package weight.
     * Calls GET /courier/serviceability/
     */
    public ShiprocketRateResponse getShippingRates(String pickupPostcode, String deliveryPostcode,
                                                    double weight, int cod,
                                                    double length, double breadth, double height) {
        String uri = UriComponentsBuilder.fromUriString(props.getBaseUrl() + "/courier/serviceability/")
                .queryParam("pickup_postcode", pickupPostcode)
                .queryParam("delivery_postcode", deliveryPostcode)
                .queryParam("weight", weight)
                .queryParam("cod", cod)
                .queryParam("length", length)
                .queryParam("breadth", breadth)
                .queryParam("height", height)
                .toUriString();

        log.info("Shiprocket GET rates request: pickup={} delivery={} weight={} cod={} dims={}x{}x{}",
                pickupPostcode, deliveryPostcode, weight, cod, length, breadth, height);

        ShiprocketRateResponse rateResponse = restClient.get()
                .uri(uri)
                .header("Authorization", authService.getAuthHeader())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Shiprocket rate API error: {}", body);
                    throw new RuntimeException("Shiprocket rate API error: " + body);
                })
                .body(ShiprocketRateResponse.class);
        log.info("Shiprocket GET rates response: {}", toJson(rateResponse));
        return rateResponse;
    }

    // -------------------------------------------------------------------------
    // estimated_date_of_delivery
    // -------------------------------------------------------------------------

    /**
     * Estimates the delivery date for a shipment.
     * Calls GET /courier/estimate
     */
    public Map<String, Object> getEstimatedDelivery(String pickupPostcode, String deliveryPostcode,
                                                     double weight, Long courierId) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(props.getBaseUrl() + "/courier/estimate")
                .queryParam("pickup_postcode", pickupPostcode)
                .queryParam("delivery_postcode", deliveryPostcode)
                .queryParam("weight", weight);
        if (courierId != null) {
            builder.queryParam("courier_id", courierId);
        }

        log.info("Shiprocket GET delivery-estimate request: pickup={} delivery={} weight={} courierId={}",
                pickupPostcode, deliveryPostcode, weight, courierId);

        return get(builder.toUriString());
    }

    // -------------------------------------------------------------------------
    // order_list
    // -------------------------------------------------------------------------

    /**
     * Lists orders from Shiprocket account.
     * Calls GET /orders
     */
    public Map<String, Object> listOrders(int page, int perPage) {
        String uri = UriComponentsBuilder.fromUriString(props.getBaseUrl() + "/orders")
                .queryParam("page", page)
                .queryParam("per_page", perPage)
                .toUriString();

        log.info("Shiprocket GET orders request: page={} perPage={}", page, perPage);
        return get(uri);
    }

    // -------------------------------------------------------------------------
    // order_track (manual pull)
    // -------------------------------------------------------------------------

    /**
     * Tracks a shipment by its AWB code.
     * Calls GET /courier/track/awb/{awb}
     */
    public ShiprocketTrackResponse trackOrder(String awb) {
        String uri = props.getBaseUrl() + "/courier/track/awb/" + awb;
        log.info("Shiprocket GET track request: awb={}", awb);

        ShiprocketTrackResponse trackResponse = restClient.get()
                .uri(uri)
                .header("Authorization", authService.getAuthHeader())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Shiprocket track API error for awb={}: {}", awb, body);
                    throw new RuntimeException("Shiprocket track API error: " + body);
                })
                .body(ShiprocketTrackResponse.class);
        log.info("Shiprocket GET track response [awb={}]: {}", awb, toJson(trackResponse));
        return trackResponse;
    }

    // -------------------------------------------------------------------------
    // order_ship (assign courier + AWB)
    // -------------------------------------------------------------------------

    /**
     * Assigns a courier to a shipment and generates the AWB.
     * Calls POST /orders/assignawb
     */
    public Map<String, Object> assignCourier(Long shipmentId, Long courierId) {
        Map<String, Object> body = Map.of(
                "shipment_id", shipmentId,
                "courier_id", courierId
        );
        log.info("Shiprocket POST assignawb request: shipmentId={} courierId={}", shipmentId, courierId);
        return post("/courier/assign/awb", body);
    }

    // -------------------------------------------------------------------------
    // order_pickup_schedule
    // -------------------------------------------------------------------------

    /**
     * Schedules a pickup for one or more shipments.
     * Calls POST /courier/generate/pickup
     */
    public Map<String, Object> schedulePickup(List<Long> shipmentIds) {
        Map<String, Object> body = Map.of("shipment_id", shipmentIds);
        log.info("Shiprocket POST schedule-pickup request: shipmentIds={}", shipmentIds);
        return post("/courier/generate/pickup", body);
    }

    // -------------------------------------------------------------------------
    // generate_shipment_label
    // -------------------------------------------------------------------------

    /**
     * Generates or retrieves the shipping label for one or more shipments.
     * Calls GET /orders/print/label
     * Returns a map containing "label_url".
     */
    public Map<String, Object> generateLabel(List<Long> shipmentIds) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(props.getBaseUrl() + "/orders/print/label");
        for (Long id : shipmentIds) {
            builder.queryParam("shipment_id[]", id);
        }
        log.info("Shiprocket GET label request: shipmentIds={}", shipmentIds);
        return get(builder.toUriString());
    }

    // -------------------------------------------------------------------------
    // order_cancel
    // -------------------------------------------------------------------------

    /**
     * Cancels one or more Shiprocket orders by their Shiprocket order IDs.
     * Calls POST /orders/cancel
     */
    public Map<String, Object> cancelOrders(List<Long> shiprocketOrderIds) {
        Map<String, Object> body = Map.of("ids", shiprocketOrderIds);
        log.info("Shiprocket POST cancel request: shiprocketOrderIds={}", shiprocketOrderIds);
        return post("/orders/cancel", body);
    }

    // -------------------------------------------------------------------------
    // list_pickup_addresses
    // -------------------------------------------------------------------------

    /**
     * Retrieves all pickup addresses configured in the Shiprocket seller account.
     * Calls GET /settings/company/pickup
     */
    public ShiprocketPickupAddressesResponse listPickupAddresses() {
        log.info("Shiprocket GET pickup-addresses request");
        ShiprocketPickupAddressesResponse pickupResponse = restClient.get()
                .uri(props.getBaseUrl() + "/settings/company/pickup")
                .header("Authorization", authService.getAuthHeader())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Shiprocket pickup addresses API error: {}", body);
                    throw new RuntimeException("Shiprocket pickup addresses API error: " + body);
                })
                .body(ShiprocketPickupAddressesResponse.class);
        log.info("Shiprocket GET pickup-addresses response: {}", toJson(pickupResponse));
        return pickupResponse;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private Map<String, Object> get(String uri) {
        Map<String, Object> response = restClient.get()
                .uri(uri)
                .header("Authorization", authService.getAuthHeader())
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Shiprocket GET error [{}]: {}", uri, body);
                    throw new RuntimeException("Shiprocket API error: " + body);
                })
                .body(Map.class);
        log.info("Shiprocket GET [{}] response: {}", uri, toJson(response));
        return response;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(String path, Object requestBody) {
        log.info("Shiprocket POST [{}] request body: {}", path, toJson(requestBody));
        Map<String, Object> response = restClient.post()
                .uri(props.getBaseUrl() + path)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", authService.getAuthHeader())
                .body(requestBody)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Shiprocket POST error [{}]: {}", path, body);
                    throw new RuntimeException("Shiprocket API error: " + body);
                })
                .body(Map.class);
        log.info("Shiprocket POST [{}] response: {}", path, toJson(response));
        return response;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    /**
     * After Shiprocket order creation, automatically:
     * 1. Queries serviceability to get the recommended courier ID
     * 2. Assigns AWB via /courier/assign/awb
     * 3. Updates the local Shipment entity with AWB + carrier
     * 4. Schedules pickup via /courier/generate/pickup
     *
     * All steps are best-effort — failures are logged but do not roll back the order.
     */
    @SuppressWarnings("unchecked")
    private void autoFulfillShipment(Shipment shipment, String deliveryPostcode, Long shiprocketShipmentId, Long preferredCourierId, double actualWeight) {
        if (shiprocketShipmentId == null) {
            log.warn("autoFulfillShipment: shiprocketShipmentId is null for shipment {}, skipping", shipment.getId());
            return;
        }

        // Step 1 — resolve courier ID: honour user's choice if present, else query serviceability
        Long courierId = null;
        String courierName = null;
        String awb = null;

        double dimLength  = shipment.getLengthCm()  != null ? shipment.getLengthCm()  : props.getDefaultLength();
        double dimBreadth = shipment.getBreadthCm() != null ? shipment.getBreadthCm() : props.getDefaultBreadth();
        double dimHeight  = shipment.getHeightCm()  != null ? shipment.getHeightCm()  : props.getDefaultHeight();

        if (preferredCourierId != null) {
            // User selected a specific courier at checkout — verify it is not blocked
            ShiprocketRateResponse rates = getShippingRates(
                    props.getPickupPostcode(),
                    deliveryPostcode,
                    actualWeight,
                    0,
                    dimLength, dimBreadth, dimHeight
            );
            if (rates != null && rates.getData() != null) {
                var available = rates.getData().getAvailableCourierCompanies();
                if (available != null) {
                    var preferred = available.stream()
                            .filter(c -> c.getCourierCompanyId() != null
                                    && c.getCourierCompanyId().equals(preferredCourierId.intValue()))
                            .findFirst()
                            .orElse(null);
                    if (preferred != null) {
                        if (Integer.valueOf(1).equals(preferred.getBlocked())) {
                            log.warn("autoFulfillShipment: user-preferred courier_id={} is blocked on Shiprocket, falling back to recommendation",
                                    preferredCourierId);
                        } else {
                            courierId = preferredCourierId;
                            courierName = preferred.getCourierName();
                            log.info("autoFulfillShipment: using user-selected courier_id={} name={} for shipment {}",
                                    courierId, courierName, shipment.getId());
                        }
                    } else {
                        log.warn("autoFulfillShipment: user-preferred courier_id={} not found in available couriers, falling back",
                                preferredCourierId);
                    }
                }
            }
            // If courierId still null after verification, fall through to recommendation logic
        }

        // Step 1 (fallback) — query serviceability for recommended courier
        if (courierId == null) {
            // Fall back to Shiprocket's recommended courier from serviceability check
            try {
                ShiprocketRateResponse rates = getShippingRates(
                        props.getPickupPostcode(),
                        deliveryPostcode,
                        actualWeight,
                        0,
                        dimLength, dimBreadth, dimHeight
                );
                if (rates != null && rates.getData() != null) {
                    var data = rates.getData();
                    var available = data.getAvailableCourierCompanies();
                    if (available != null && !available.isEmpty()) {
                        // Find the courier from the list whose ID matches the recommended one
                        ShiprocketRateResponse.CourierOption chosen = null;
                        Integer recommendedId = data.getRecommendedCourierCompanyId();
                        if (recommendedId != null) {
                            chosen = available.stream()
                                    .filter(c -> c.getCourierCompanyId() != null
                                            && c.getCourierCompanyId().equals(recommendedId)
                                            && !Integer.valueOf(1).equals(c.getBlocked()))
                                    .findFirst()
                                    .orElse(null);
                        }
                        // Fallback: first non-blocked courier in the list
                        if (chosen == null) {
                            chosen = available.stream()
                                    .filter(c -> c.getCourierCompanyId() != null
                                            && !Integer.valueOf(1).equals(c.getBlocked()))
                                    .findFirst()
                                    .orElse(null);
                        }
                        if (chosen != null) {
                            courierId = chosen.getCourierCompanyId().longValue();
                            courierName = chosen.getCourierName();
                        }
                    }
                    log.info("autoFulfillShipment: selected courier_id={} name={} for delivery postcode={}",
                            courierId, courierName, deliveryPostcode);
                }
            } catch (Exception e) {
                log.error("autoFulfillShipment: serviceability call failed for shipment {}: {}",
                        shipment.getId(), e.getMessage());
            }
        }

        // Step 2 — call assignawb API (courierId is guaranteed non-null at this point)
        if (courierId == null) {
            throw new IllegalStateException("autoFulfillShipment: courierId is null — cannot assign AWB for shipment " + shiprocketShipmentId);
        }
        // Shiprocket needs a few seconds to transition a newly-created shipment from
        // "NEW" → assignable state. Without this delay, /orders/assignawb returns 404.
        try { Thread.sleep(10000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
        Map<String, Object> assignResp = assignCourier(shiprocketShipmentId, courierId);
        log.info("autoFulfillShipment: assignawb response for shipment {}: {}", shiprocketShipmentId, assignResp);

        // Response structure: { response: { data: { awb_code: "..." } } } or directly { awb_code: "..." }
        awb = extractStringFromNestedMap(assignResp, "awb_code");
        if (awb == null || awb.isBlank()) {
            // Try response.data.awb_code
            Object responseObj = assignResp.get("response");
            if (responseObj instanceof Map<?,?> respMap) {
                Object dataObj = respMap.get("data");
                if (dataObj instanceof Map<?,?> dataMap) {
                    Object awbObj = dataMap.get("awb_code");
                    if (awbObj != null) awb = awbObj.toString();
                }
            }
        }
        // Also try courier_name
        if (courierName == null) {
            String cn = extractStringFromNestedMap(assignResp, "courier_name");
            if (cn != null && !cn.isBlank()) courierName = cn;
        }

        if (awb != null && !awb.isBlank()) {
            log.info("autoFulfillShipment: AWB assigned={} carrier={} for shipment {}", awb, courierName, shipment.getId());
            shipment.setTrackingNumber(awb);
            if (courierName != null) shipment.setCarrier(courierName);
            shipment.setStatus(ShipmentStatus.PICKUP_SCHEDULED);
            shipmentRepository.save(shipment);
        } else {
            log.warn("autoFulfillShipment: AWB not found in assignawb response for shipment {}", shiprocketShipmentId);
            throw new RuntimeException("AWB not found in assignCourier response for shipment " + shiprocketShipmentId);
        }

        // Step 3 — schedule pickup
        Map<String, Object> pickupResp = schedulePickup(List.of(shiprocketShipmentId));
        log.info("autoFulfillShipment: pickup scheduled for shipment {}: {}", shiprocketShipmentId, pickupResp);
    }

    /** Recursively searches a Map for the first occurrence of the given key (shallow then one level deep). */
    @SuppressWarnings("unchecked")
    private String extractStringFromNestedMap(Map<String, Object> map, String key) {
        if (map == null) return null;
        Object direct = map.get(key);
        if (direct != null) return direct.toString();
        for (Object v : map.values()) {
            if (v instanceof Map<?,?> nested) {
                Object found = ((Map<String, Object>) nested).get(key);
                if (found != null) return found.toString();
            }
        }
        return null;
    }

    /**
     * Calls Shiprocket /orders/create/adhoc with up to 3 attempts and exponential backoff.
     * Returns the parsed response if Shiprocket acknowledges the order (orderId present),
     * or null if all attempts fail.
     *
     * If Shiprocket rejects the pickup location, the first valid location from the error
     * response is extracted and the request is retried immediately without sleeping.
     */
    @SuppressWarnings("unchecked")
    private ShiprocketOrderResponse callShiprocketWithRetry(String shiprocketOrderId, ShiprocketOrderRequest payload) {
        final int MAX_ATTEMPTS = 3;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            final int currentAttempt = attempt;
            try {
                String raw = restClient.post()
                        .uri(props.getBaseUrl() + "/orders/create/adhoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", authService.getAuthHeader())
                        .body(payload)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, (req, res) -> {
                            String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                            log.error("Shiprocket API error for order {} attempt {}/{} — HTTP {}: {}",
                                    shiprocketOrderId, currentAttempt, MAX_ATTEMPTS, res.getStatusCode(), body);
                            throw new RuntimeException("Shiprocket HTTP " + res.getStatusCode() + ": " + body);
                        })
                        .body(String.class);

                log.info("Shiprocket raw response for order {} attempt {}/{}: {}",
                        shiprocketOrderId, currentAttempt, MAX_ATTEMPTS, raw);

                if (raw == null || raw.isBlank()) {
                    log.warn("Shiprocket returned empty body for order {} attempt {}/{}",
                            shiprocketOrderId, currentAttempt, MAX_ATTEMPTS);
                } else {
                    // Check for wrong pickup location error and self-heal by using the location
                    // that Shiprocket returns in the error response data
                    Map<String, Object> rawMap = objectMapper.readValue(raw, Map.class);
                    String message = rawMap.get("message") instanceof String m ? m : "";
                    if (message.toLowerCase().contains("pickup location")) {
                        String corrected = extractFirstPickupLocation(rawMap);
                        if (corrected != null && !corrected.isBlank()
                                && !corrected.equals(payload.getPickupLocation())) {
                            log.warn("Shiprocket rejected pickup location '{}' for order {} — retrying with '{}'",
                                    payload.getPickupLocation(), shiprocketOrderId, corrected);
                            payload = payload.toBuilder().pickupLocation(corrected).build();
                            continue; // retry immediately without sleeping
                        }
                        log.warn("Shiprocket pickup location error but could not extract correction for order {}: {}",
                                shiprocketOrderId, raw);
                    }

                    ShiprocketOrderResponse response = objectMapper.readValue(raw, ShiprocketOrderResponse.class);
                    if (response.getOrderId() != null) {
                        return response;
                    }
                    log.warn("Shiprocket response missing order_id for order {} attempt {}/{}: {}",
                            shiprocketOrderId, currentAttempt, MAX_ATTEMPTS, raw);
                }
            } catch (Exception e) {
                log.error("Shiprocket call failed for order {} attempt {}/{}: {}",
                        shiprocketOrderId, currentAttempt, MAX_ATTEMPTS, e.getMessage());
            }

            if (attempt < MAX_ATTEMPTS) {
                try {
                    Thread.sleep(1000L * attempt); // 1 s then 2 s
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Extracts the first pickup_location name from a Shiprocket "wrong pickup" error response.
     * Response shape: {"data":{"data":[{"pickup_location":"warehouse",...}]}}
     */
    @SuppressWarnings("unchecked")
    private String extractFirstPickupLocation(Map<String, Object> rawMap) {
        try {
            Object dataObj = rawMap.get("data");
            if (dataObj instanceof Map<?, ?> outer) {
                Object innerObj = ((Map<String, Object>) outer).get("data");
                if (innerObj instanceof List<?> list && !list.isEmpty()) {
                    Object first = list.get(0);
                    if (first instanceof Map<?, ?> loc) {
                        Object name = ((Map<String, Object>) loc).get("pickup_location");
                        return name != null ? name.toString() : null;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not extract pickup location from error response: {}", e.getMessage());
        }
        return null;
    }

    private ShipmentStatus mapToShipmentStatus(String shiprocketStatus) {
        if (shiprocketStatus == null) return null;
        return switch (shiprocketStatus.toLowerCase()) {
            case "pickup scheduled", "pickup queued", "out for pickup" -> ShipmentStatus.PICKUP_SCHEDULED;
            case "in transit", "reached at destination hub" -> ShipmentStatus.IN_TRANSIT;
            case "out for delivery" -> ShipmentStatus.OUT_FOR_DELIVERY;
            case "delivered" -> ShipmentStatus.DELIVERED;
            case "cancelled" -> ShipmentStatus.CANCELLED;
            case "rto initiated", "rto delivered", "rto acknowledged" -> ShipmentStatus.RTO;
            default -> null;
        };
    }

    @Transactional
    public void syncShipmentStatus(Shipment shipment) {
        if (shipment.getShiprocketShipmentId() == null) {
            log.warn("Cannot sync shipment status: no Shiprocket shipment ID for shipment {}", shipment.getId());
            return;
        }
        try {
            String url = props.getBaseUrl() + "/shipments/" + shipment.getShiprocketShipmentId() + "/track";
            String bearerToken = authService.getAuthHeader();

            ShiprocketTrackResponse response = restClient.get()
                    .uri(url)
                    .header("Authorization", bearerToken)
                    .retrieve()
                    .body(ShiprocketTrackResponse.class);

            if (response != null && response.getTrackingData() != null &&
                    response.getTrackingData().getShipmentTrack() != null &&
                    !response.getTrackingData().getShipmentTrack().isEmpty()) {
                var trackData = response.getTrackingData().getShipmentTrack().get(0);
                shipment.setStatus(mapToShipmentStatus(trackData.getCurrentStatus()));
                shipment.setCarrier(trackData.getCourierName());
                if (trackData.getDeliveredDate() != null) {
                    try {
                        shipment.setEstimatedDelivery(OffsetDateTime.parse(trackData.getDeliveredDate() + "T00:00:00Z"));
                    } catch (Exception e) {
                        log.debug("Could not parse delivered date: {}", trackData.getDeliveredDate());
                    }
                }
                shipmentRepository.save(shipment);
                log.info("Updated shipment {} status to {}", shipment.getId(), shipment.getStatus());
            }
        } catch (Exception e) {
            log.error("Failed to sync shipment status for shipment {}: {}", shipment.getId(), e.getMessage());
            throw new RuntimeException("Failed to fetch shipment status: " + e.getMessage(), e);
        }
    }
}
