package com.ascendons.razorpay.service;

import com.ascendons.email.EmailService;
import com.ascendons.exception.BadRequestException;
import com.ascendons.exception.PaymentGatewayException;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.inventory.entity.InventoryMovement;
import com.ascendons.inventory.repository.InventoryMovementRepository;
import com.ascendons.inventory.repository.InventoryRepository;
import com.ascendons.order.entity.*;
import com.ascendons.order.repository.OrderRepository;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import com.ascendons.order.repository.PaymentRepository;
import com.ascendons.razorpay.config.RazorpayProperties;
import com.ascendons.razorpay.dto.InitiatePaymentRequest;
import com.ascendons.razorpay.dto.RazorpayOrderResponse;
import com.ascendons.razorpay.dto.VerifyPaymentRequest;
import com.ascendons.shiprocket.service.ShiprocketService;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final RazorpayProperties props;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ShiprocketService shiprocketService;
    private final EmailService emailService;

    
    @PostConstruct
    void validateWebhookSecret() {
        if (props.getWebhookSecret() == null || props.getWebhookSecret().isBlank()) {
            log.warn("⚠️ RZP_WEBHOOK_SECRET is not configured — webhook signature verification is DISABLED. " +
                    "Set app.razorpay.webhook-secret in production to enable verification. " +
                    "DO NOT deploy without this in production.");
        } else {
            log.info("Razorpay webhook secret configured — signature verification enabled.");
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 1. Create Razorpay order and internal Payment record
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public RazorpayOrderResponse createOrder(UUID userId, InitiatePaymentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to this user");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled order");
        }

        // Prevent duplicate payment creation — reuse existing CREATED payment if present
        return paymentRepository.findByOrderIdAndStatus(order.getId(), PaymentStatus.CREATED)
                .stream()
                .findFirst()
                .map(existing -> buildResponse(existing, order))
                .orElseGet(() -> createNewRazorpayOrder(order));
    }

    private RazorpayOrderResponse createNewRazorpayOrder(Order order) {
        long amountInPaisa = toINRPaisa(order.getTotalAmount(), order.getExchangeRate());

        try {
            JSONObject options = new JSONObject();
            options.put("amount", amountInPaisa);
            options.put("currency", "INR");
            options.put("receipt", "order_" + order.getId().toString().replace("-", "").substring(0, 20));
            options.put("payment_capture", 1); // auto-capture

            com.razorpay.Order rzpOrder = razorpayClient.orders.create(options);
            String rzpOrderId = rzpOrder.get("id");

            Payment payment = Payment.builder()
                    .order(order)
                    .provider(PaymentProvider.RAZORPAY)
                    .paymentMode(PaymentMode.UPI) // placeholder; updated by webhook/verify
                    .status(PaymentStatus.CREATED)
                    .amount(order.getTotalAmount())
                    .currency("INR")
                    .providerOrderId(rzpOrderId)
                    .build();
            payment = paymentRepository.save(payment);

            log.info("Created Razorpay order {} for internal order {}", rzpOrderId, order.getId());
            return buildResponse(payment, order);

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order for order {}: {}", order.getId(), e.getMessage());
            throw new PaymentGatewayException("Payment gateway error. Please try again.", e);
        }
    }

    private RazorpayOrderResponse buildResponse(Payment payment, Order order) {
        String name = order.getUser().getFirstName()
                + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
        return RazorpayOrderResponse.builder()
                .keyId(props.getActiveKeyId())
                .razorpayOrderId(payment.getProviderOrderId())
                .amountInPaisa(toINRPaisa(order.getTotalAmount(), order.getExchangeRate()))
                .currency("INR")
                .internalOrderId(order.getId())
                .internalPaymentId(payment.getId())
                .customerName(name)
                .customerEmail(order.getUser().getEmail())
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 2. Verify client-side payment & capture
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public void verifyAndCapture(VerifyPaymentRequest request) {
        // HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId, props.getActiveKeySecret())
        String expectedSignature = hmacSha256(
                request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                props.getActiveKeySecret());

        if (!expectedSignature.equals(request.getRazorpaySignature())) {
            log.warn("Razorpay signature mismatch for payment {}", request.getRazorpayPaymentId());
            throw new BadRequestException("Payment signature verification failed");
        }

        Payment payment = paymentRepository.findById(request.getInternalPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", request.getInternalPaymentId()));

        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            log.info("Payment {} already captured — idempotent", payment.getId());
            return;
        }

        // Fetch actual payment details from Razorpay: validate amount + resolve payment method
        PaymentMode resolvedMode = PaymentMode.UPI;
        try {
            com.razorpay.Payment rzpPayment = razorpayClient.payments.fetch(request.getRazorpayPaymentId());
            resolvedMode = resolvePaymentMode(rzpPayment.get("method"));

            // Amount guard: reject if Razorpay amount != order total (anti-tamper)
            long rzpAmountPaisa = Long.parseLong(rzpPayment.get("amount").toString());
            long expectedPaisa  = toINRPaisa(payment.getOrder().getTotalAmount(), payment.getOrder().getExchangeRate());
            if (Math.abs(rzpAmountPaisa - expectedPaisa) > 1) { // ±1 paisa rounding tolerance
                log.error("Amount mismatch for payment {} — Razorpay: {} paisa, expected: {} paisa",
                        request.getRazorpayPaymentId(), rzpAmountPaisa, expectedPaisa);
                throw new BadRequestException("Payment amount mismatch — please contact support");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (RazorpayException e) {
            log.warn("Could not fetch payment details for {} — proceeding with signature-verified capture: {}",
                    request.getRazorpayPaymentId(), e.getMessage());
        }

        capturePayment(payment, request.getRazorpayPaymentId(), request.getRazorpaySignature(), resolvedMode);
        // Shiprocket push paused — admin enters tracking manually
        // pushToShiprocket(payment);
    }

    // ──────────────────────────────────────────────────────────────
    // 3. Webhook handler (fallback / authoritative source of truth)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public void handleWebhook(String rawPayload, String signature) {
        String secret = props.getWebhookSecret();
        if (secret != null && !secret.isBlank()) {
            String expected = hmacSha256(rawPayload, secret);
            if (!expected.equals(signature)) {
                log.warn("Razorpay webhook signature mismatch — rejected");
                throw new BadRequestException("Invalid webhook signature");
            }
        }

        JSONObject payload = new JSONObject(rawPayload);
        String event = payload.optString("event", "");
        log.info("Razorpay webhook event: {}", event);

        switch (event) {
            case "payment.captured" -> handlePaymentCaptured(payload);
            case "payment.failed"   -> handlePaymentFailed(payload);
            case "order.paid"       -> handleOrderPaid(payload);
            default                 -> log.debug("Unhandled Razorpay webhook event: {}", event);
        }
    }

    // ── private webhook handlers ──────────────────────────────────

    private void handlePaymentCaptured(JSONObject payload) {
        JSONObject entity = payload.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity");
        String rzpPaymentId = entity.getString("id");
        String rzpOrderId   = entity.getString("order_id");
        PaymentMode mode    = resolvePaymentMode(entity.optString("method", "upi"));

        paymentRepository.findByProviderOrderId(rzpOrderId).ifPresent(payment -> {
            if (payment.getStatus() != PaymentStatus.CAPTURED) {
                capturePayment(payment, rzpPaymentId, null, mode);
            } else {
                log.info("Webhook payment.captured: payment {} already captured", rzpPaymentId);
            }
            // Shiprocket push paused — admin enters tracking manually
            // pushToShiprocket(payment);
        });
    }

    private void handlePaymentFailed(JSONObject payload) {
        String rzpOrderId = payload.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity").getString("order_id");
        String errorDesc = payload.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity")
                .optString("error_description", "Payment failed");

        paymentRepository.findByProviderOrderId(rzpOrderId).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.CREATED || payment.getStatus() == PaymentStatus.AUTHORIZED) {
                failPayment(payment, errorDesc);
            }
        });
    }

    private void handleOrderPaid(JSONObject payload) {
        // order.paid fires when all payments for the order total are captured
        String rzpOrderId = payload.getJSONObject("payload")
                .getJSONObject("order").getJSONObject("entity").getString("id");
        JSONObject paymentEntity = payload.getJSONObject("payload")
                .getJSONObject("payment").getJSONObject("entity");
        String rzpPaymentId = paymentEntity.getString("id"); // throws if missing — reject malformed payload
        PaymentMode mode    = resolvePaymentMode(paymentEntity.optString("method", "upi"));

        paymentRepository.findByProviderOrderId(rzpOrderId).ifPresent(payment -> {
            if (payment.getStatus() != PaymentStatus.CAPTURED) {
                capturePayment(payment, rzpPaymentId, null, mode);
            }
            // Shiprocket push paused — admin enters tracking manually
            // pushToShiprocket(payment);
        });
    }

    // ── shared capture / fail logic ───────────────────────────────

    /**
     * Marks payment as CAPTURED and order as CONFIRMED.
     * Does NOT push to Shiprocket — that is exclusively the webhook's responsibility.
     */
    private void capturePayment(Payment payment, String rzpPaymentId, String signature, PaymentMode paymentMode) {
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setProviderPaymentId(rzpPaymentId);
        if (signature != null) payment.setProviderSignature(signature);
        if (paymentMode != null) payment.setPaymentMode(paymentMode);
        payment.setPaidAt(OffsetDateTime.now());
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        log.info("Payment {} captured for order {}", payment.getId(), order.getId());

        // Send order confirmation email (best-effort — never fail the payment flow)
        try {
            String customerName = order.getUser().getFirstName()
                    + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
            List<EmailService.OrderItemSummary> items = order.getItems().stream()
                    .map(i -> new EmailService.OrderItemSummary(
                            i.getProductVariant().getProduct().getName(),
                            i.getProductVariant().getSku(),
                            i.getQuantity(),
                            i.getPrice()))
                    .toList();
            emailService.sendOrderConfirmationEmail(
                    order.getUser().getEmail(),
                    customerName,
                    order.getId().toString(),
                    items,
                    order.getTotalAmount(),
                    order.getCurrency() != null ? order.getCurrency() : "INR"
            );
        } catch (Exception e) {
            log.error("Failed to send order confirmation email for order {}: {}", order.getId(), e.getMessage());
        }
    }

    /**
     * Pushes a confirmed order to Shiprocket. Called only from webhook handlers to ensure
     * Shiprocket receives the order exactly once via a reliable server-to-server path.
     */
    private void pushToShiprocket(Payment payment) {
        Order order = payment.getOrder();
        if (payment.getStatus() != PaymentStatus.CAPTURED) {
            log.warn("Skipping Shiprocket push — payment {} not yet captured", payment.getId());
            return;
        }
        try {
            shiprocketService.createShiprocketOrder(order);
        } catch (Exception e) {
            log.error("Shiprocket order creation failed for order {} — can be retried via admin endpoint: {}",
                    order.getId(), e.getMessage());
        }
    }

    private void failPayment(Payment payment, String reason) {
        // Idempotency guard — skip if already FAILED
        if (payment.getStatus() == PaymentStatus.FAILED) {
            log.info("failPayment: payment {} already FAILED — skipping duplicate handling", payment.getId());
            return;
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        if (order.getStatus() == OrderStatus.CANCELLED) {
            log.info("failPayment: order {} already CANCELLED — skipping duplicate cancellation", order.getId());
            return;
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Restore inventory — set flag FIRST then restore, preventing double-restoration
        // if two failure events arrive concurrently (both would see flag=false otherwise)
        if (!Boolean.TRUE.equals(order.getInventoryRestored())) {
            order.setInventoryRestored(true);
            orderRepository.save(order); // commit the flag before touching inventory
            order.getItems().forEach(item -> {
                inventoryRepository.findByIdForUpdate(item.getProductVariant().getId()).ifPresent(inv -> {
                    inv.setQuantity(inv.getQuantity() + item.getQuantity());
                    inventoryRepository.save(inv);
                    movementRepository.save(InventoryMovement.builder()
                            .productVariant(item.getProductVariant())
                            .changeQty(item.getQuantity())
                            .reason("Payment failed — inventory released for order: " + order.getId())
                            .build());
                });
            });
        }
        log.info("Payment {} failed for order {} — inventory restored", payment.getId(), order.getId());

        try {
            String customerName = order.getUser().getFirstName()
                    + (order.getUser().getLastName() != null ? " " + order.getUser().getLastName() : "");
            emailService.sendOrderCancelledEmail(
                    order.getUser().getEmail(), customerName,
                    order.getId().toString(), "Payment failed: " + reason);
        } catch (Exception e) {
            log.error("Failed to send cancellation email for order {}: {}", order.getId(), e.getMessage());
        }
    }

    // ── utilities ─────────────────────────────────────────────────

    /** Convert order total to INR paisa. If the order was charged in a foreign
     *  currency, reverse the exchange rate to get the INR base amount. */
    private long toINRPaisa(BigDecimal totalAmount, BigDecimal exchangeRate) {
        BigDecimal rate = (exchangeRate == null || exchangeRate.compareTo(BigDecimal.ZERO) == 0)
                ? BigDecimal.ONE : exchangeRate;
        BigDecimal inr = totalAmount.divide(rate, 2, RoundingMode.HALF_UP);
        return inr.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
    }

    /** Map Razorpay method strings → our PaymentMode enum. Defaults to UPI on unknown values. */
    private PaymentMode resolvePaymentMode(String method) {
        if (method == null) return PaymentMode.UPI;
        return switch (method.toLowerCase()) {
            case "card"       -> PaymentMode.CREDIT_CARD; // Razorpay doesn't distinguish debit vs credit at this level
            case "netbanking" -> PaymentMode.NET_BANKING;
            case "wallet"     -> PaymentMode.WALLET;
            case "emi"        -> PaymentMode.EMI;
            default           -> PaymentMode.UPI;         // "upi" and anything unrecognised
        };
    }

    // ──────────────────────────────────────────────────────────────
    // 4. Reconciliation hooks (called by PaymentReconciliationScheduler)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    void reconcileCapture(Payment payment, String rzpPaymentId, String rzpMethod) {
        if (payment.getStatus() == PaymentStatus.CAPTURED) return;
        capturePayment(payment, rzpPaymentId, null, resolvePaymentMode(rzpMethod));
        // Shiprocket push paused — admin enters tracking manually
        // pushToShiprocket(payment);
    }

    @Transactional
    void reconcileFail(Payment payment, String reason) {
        failPayment(payment, reason);
    }

    public Map<String, Object> issueRefund(String providerPaymentId, BigDecimal amount) {
        try {
            org.json.JSONObject options = new org.json.JSONObject();
            // amount is already in INR — convert to paisa
            long amountPaisa = amount.multiply(java.math.BigDecimal.valueOf(100))
                    .setScale(0, java.math.RoundingMode.HALF_UP).longValue();
            options.put("amount", amountPaisa);
            Object refund = razorpayClient.payments.refund(providerPaymentId, options);
            log.info("Razorpay refund issued for payment {}: {}", providerPaymentId, refund);
            return Map.of("success", true, "refund", refund.toString());
        } catch (com.razorpay.RazorpayException e) {
            log.error("Razorpay refund failed for payment {}: {}", providerPaymentId, e.getMessage());
            throw new PaymentGatewayException("Refund failed: " + e.getMessage(), e);
        }
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
