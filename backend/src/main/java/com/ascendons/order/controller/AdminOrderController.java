package com.ascendons.order.controller;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.order.dto.OrderResponse;
import com.ascendons.order.dto.UpdateOrderStatusRequest;
import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.order.entity.Payment;
import com.ascendons.order.entity.PaymentStatus;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.service.InvoiceService;
import com.ascendons.order.service.OrderService;
import com.ascendons.razorpay.service.RazorpayService;
import com.ascendons.shiprocket.service.ShiprocketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminOrderController {

    private final OrderService orderService;
    private final ShiprocketService shiprocketService;
    private final RazorpayService razorpayService;
    private final InvoiceService invoiceService;
    private final OrderRepository orderRepository;

    // ── list ──────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID userId) {
        OrderStatus orderStatus = null;
        if (status != null && !status.isBlank()) {
            try { orderStatus = OrderStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        OffsetDateTime from = days != null ? OffsetDateTime.now().minusDays(days) : null;
        return ResponseEntity.ok(orderService.getAllOrders(orderStatus, from, search, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // ── status ────────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request));
    }

    @PatchMapping("/{id}/bulk-status")
    public ResponseEntity<Map<String, Object>> bulkUpdateStatus(
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String newStatus = (String) body.get("status");
        int updated = 0, failed = 0;
        for (String idStr : ids) {
            try {
                UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
                req.setStatus(newStatus);
                orderService.updateOrderStatus(UUID.fromString(idStr), req);
                updated++;
            } catch (Exception e) {
                log.warn("Bulk status update failed for order {}: {}", idStr, e.getMessage());
                failed++;
            }
        }
        return ResponseEntity.ok(Map.of("updated", updated, "failed", failed));
    }

    // ── admin notes ───────────────────────────────────────────────────────────

    @PatchMapping("/{id}/notes")
    public ResponseEntity<OrderResponse> updateNotes(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateAdminNotes(id, body.get("notes")));
    }

    // ── returns ───────────────────────────────────────────────────────────────

    @PostMapping("/{id}/accept-return")
    public ResponseEntity<OrderResponse> acceptReturn(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.approveReturn(id));
    }

    @PostMapping("/{id}/reject-return")
    public ResponseEntity<OrderResponse> rejectReturn(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.rejectReturn(id));
    }

    // ── refund ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/refund")
    public ResponseEntity<Map<String, Object>> refundOrder(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        Payment captured = order.getPayments().stream()
                .filter(p -> p.getStatus() == PaymentStatus.CAPTURED && p.getProviderPaymentId() != null)
                .findFirst()
                .orElseThrow(() -> new com.ascendons.exception.BadRequestException(
                        "No captured payment found for this order"));
        Map<String, Object> result = razorpayService.issueRefund(
                captured.getProviderPaymentId(), captured.getAmount());
        log.info("Admin refund for order {}: {}", id, result);
        return ResponseEntity.ok(result);
    }

    // ── one-time data fix ────────────────────────────────────────────────────

    /**
     * Backfills per-item GST amounts on orders placed before the discounted-item-tax fix.
     * Safe to call repeatedly — already-consistent orders are skipped. See OrderService
     * for details on why this discrepancy occurs.
     */
    @PostMapping("/backfill-discounted-item-tax")
    public ResponseEntity<Map<String, Object>> backfillDiscountedItemTax() {
        Map<String, Object> result = orderService.backfillDiscountedItemTax();
        log.info("Admin-triggered backfill of discounted item tax: {}", result);
        return ResponseEntity.ok(result);
    }

    // ── invoice ───────────────────────────────────────────────────────────────

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable UUID id) {
        byte[] pdf = invoiceService.generateForAdmin(id);
        String filename = "invoice-" + id.toString().substring(0, 8).toUpperCase() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    // ── manual tracking ───────────────────────────────────────────────────────

    @PatchMapping("/{id}/tracking")
    public ResponseEntity<OrderResponse> updateTracking(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateTracking(
                id,
                body.get("carrier"),
                body.get("trackingNumber"),
                body.get("trackingUrl"),
                body.get("estimatedDelivery")));
    }

    // ── shiprocket (paused) ───────────────────────────────────────────────────

    @PostMapping("/{id}/push-to-shiprocket")
    public ResponseEntity<Map<String, Object>> pushToShiprocket(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        try {
            shiprocketService.createShiprocketOrder(order);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.warn("Admin push-to-shiprocket for order {} failed: {}", id, e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "warning", e.getMessage() != null ? e.getMessage() : "Shiprocket push failed"));
        }
    }

    @PostMapping("/push-pending-to-shiprocket")
    public ResponseEntity<Map<String, Object>> pushAllPendingToShiprocket() {
        List<Order> pending = orderRepository.findByStatusWithNoShipment(OrderStatus.CONFIRMED);
        log.info("Bulk Shiprocket push: found {} confirmed orders without shipment", pending.size());
        int pushed = 0, failed = 0;
        for (Order order : pending) {
            try { shiprocketService.createShiprocketOrder(order); pushed++; }
            catch (Exception e) {
                log.error("Failed to push order {} to Shiprocket: {}", order.getId(), e.getMessage());
                failed++;
            }
        }
        return ResponseEntity.ok(Map.of("total", pending.size(), "pushed", pushed, "failed", failed));
    }

    // ── shipment ──────────────────────────────────────────────────────────────

    @GetMapping("/{id}/shipments")
    public ResponseEntity<?> getShipments(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return ResponseEntity.ok(order.getShipments().stream()
                .map(s -> {
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", s.getId());
                    map.put("carrier", s.getCarrier());
                    map.put("trackingNumber", s.getTrackingNumber());
                    map.put("status", s.getStatus() != null ? s.getStatus().name() : null);
                    map.put("estimatedDelivery", s.getEstimatedDelivery());
                    map.put("createdAt", s.getCreatedAt());
                    map.put("updatedAt", s.getUpdatedAt());
                    return map;
                })
                .toList());
    }

    @PostMapping("/{id}/refresh-shipment")
    public ResponseEntity<Map<String, Object>> refreshShipmentStatus(@PathVariable UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        if (order.getShipments().isEmpty()) {
            return ResponseEntity.ok(Map.of("success", false, "message", "No shipment found for this order"));
        }
        try {
            shiprocketService.syncShipmentStatus(order.getShipments().get(0));
            return ResponseEntity.ok(Map.of("success", true, "message", "Shipment status refreshed"));
        } catch (Exception e) {
            log.warn("Failed to refresh shipment status for order {}: {}", id, e.getMessage());
            return ResponseEntity.ok(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
