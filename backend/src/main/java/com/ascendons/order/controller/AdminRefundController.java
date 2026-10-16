package com.ascendons.order.controller;

import com.ascendons.email.EmailService;
import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.order.entity.Payment;
import com.ascendons.order.entity.PaymentStatus;
import com.ascendons.order.entity.Refund;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.PaymentRepository;
import com.ascendons.order.repository.RefundRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/admin/refunds")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminRefundController {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final RazorpayClient razorpayClient;
    private final EmailService emailService;

    /** List orders eligible for or already refunded */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listRefunds() {
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED || o.getStatus() == OrderStatus.REFUNDED)
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = orders.stream().map(order -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("orderId", order.getId());
            map.put("orderStatus", order.getStatus());
            map.put("totalAmount", order.getTotalAmount());
            map.put("currency", order.getCurrency());
            map.put("couponDiscount", order.getCouponDiscount());
            map.put("createdAt", order.getCreatedAt());
            map.put("customerName", order.getUser() != null
                    ? order.getUser().getFirstName() + " " + order.getUser().getLastName()
                    : "Unknown");
            map.put("customerEmail", order.getUser() != null ? order.getUser().getEmail() : "");

            // Find paid payment
            List<Payment> payments = paymentRepository.findByOrderId(order.getId());
            Optional<Payment> paid = payments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.CAPTURED)
                    .findFirst();
            paid.ifPresent(p -> {
                map.put("paymentId", p.getId());
                map.put("paymentAmount", p.getAmount());
            });

            // Existing refunds
            List<Refund> refunds = paid.isPresent()
                    ? refundRepository.findByPaymentId(paid.get().getId())
                    : List.of();
            map.put("refunded", !refunds.isEmpty());
            map.put("refundAmount", refunds.stream().map(Refund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /** Process a refund for an order's payment — calls Razorpay API then records locally */
    @PostMapping("/{orderId}/process")
    public ResponseEntity<Map<String, Object>> processRefund(
            @PathVariable UUID orderId,
            @RequestBody(required = false) Map<String, Object> body) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() == OrderStatus.REFUNDED) {
            throw new IllegalStateException("Order has already been refunded");
        }

        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        Payment paid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.CAPTURED)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No captured payment found for this order"));

        if (paid.getProviderPaymentId() == null || paid.getProviderPaymentId().isBlank()) {
            throw new IllegalStateException("No Razorpay payment ID on record — cannot issue refund");
        }

        String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "Admin processed refund";
        BigDecimal amount = order.getTotalAmount();

        // Convert to paise (INR smallest unit) — Razorpay refund API requires integer paise
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();

        // ── 1. Issue refund via Razorpay ──────────────────────────────────────
        String rzpRefundId;
        try {
            JSONObject options = new JSONObject();
            options.put("amount", amountInPaise);
            options.put("speed", "normal");
            options.put("notes", new JSONObject().put("reason", reason).put("orderId", orderId.toString()));
            com.razorpay.Refund rzpRefund = razorpayClient.payments.refund(paid.getProviderPaymentId(), options);
            rzpRefundId = rzpRefund.get("id");
            log.info("Razorpay refund {} issued for payment {} (order {})", rzpRefundId, paid.getProviderPaymentId(), orderId);
        } catch (RazorpayException e) {
            log.error("Razorpay refund API call failed for order {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Razorpay refund failed: " + e.getMessage(), e);
        }

        // ── 2. Persist local refund record ────────────────────────────────────
        Refund refund = Refund.builder()
                .payment(paid)
                .amount(amount)
                .reason(reason + " | rzp_refund:" + rzpRefundId)
                .build();
        refundRepository.save(refund);

        // ── 3. Update statuses ────────────────────────────────────────────────
        paid.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(paid);

        order.setStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);

        // ── 4. Send refund email (best-effort) ────────────────────────────────
        try {
            String customerName = order.getUser().getFirstName()
                    + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
            emailService.sendRefundProcessedEmail(
                    order.getUser().getEmail(),
                    customerName,
                    orderId.toString(),
                    amount,
                    order.getCurrency() != null ? order.getCurrency() : "INR"
            );
        } catch (Exception e) {
            log.error("Failed to send refund email for order {}: {}", orderId, e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "message", "Refund processed successfully",
                "orderId", orderId,
                "refundAmount", amount,
                "razorpayRefundId", rzpRefundId
        ));
    }
}
