package com.ascendons.razorpay;

import com.ascendons.email.EmailService;
import com.ascendons.exception.BadRequestException;
import com.ascendons.inventory.entity.Inventory;
import com.ascendons.inventory.repository.InventoryMovementRepository;
import com.ascendons.inventory.repository.InventoryRepository;
import com.ascendons.order.entity.*;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.PaymentRepository;
import com.ascendons.razorpay.config.RazorpayProperties;
import com.ascendons.razorpay.dto.InitiatePaymentRequest;
import com.ascendons.razorpay.dto.RazorpayOrderResponse;
import com.ascendons.razorpay.dto.VerifyPaymentRequest;
import com.ascendons.razorpay.service.RazorpayService;
import com.ascendons.shiprocket.service.ShiprocketService;
import com.ascendons.user.entity.User;
import com.razorpay.OrderClient;
import com.razorpay.PaymentClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RazorpayServiceTest {

    private static final String KEY_ID     = "rzp_test_testkey";
    private static final String KEY_SECRET = "testkeysecret";
    private static final String RZP_ORDER  = "order_RZPtest123";
    private static final String RZP_PAY    = "pay_RZPpay456";

    @Mock private RazorpayClient             razorpayClient;
    @Mock private RazorpayProperties         props;
    @Mock private PaymentRepository          paymentRepository;
    @Mock private OrderRepository            orderRepository;
    @Mock private InventoryRepository        inventoryRepository;
    @Mock private InventoryMovementRepository movementRepository;
    @Mock private ShiprocketService          shiprocketService;
    @Mock private EmailService               emailService;

    @InjectMocks
    private RazorpayService razorpayService;

    // Razorpay SDK sub-clients (injected via field on the mock)
    private OrderClient   mockOrders;
    private PaymentClient mockPayments;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(props.getActiveKeyId()).thenReturn(KEY_ID);
        lenient().when(props.getActiveKeySecret()).thenReturn(KEY_SECRET);
        lenient().when(props.getWebhookSecret()).thenReturn("");

        mockOrders   = mock(OrderClient.class);
        mockPayments = mock(PaymentClient.class);
        razorpayClient.orders   = mockOrders;
        razorpayClient.payments = mockPayments;
    }

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private User makeUser(UUID id) {
        return User.builder()
                .id(id)
                .firstName("Priya")
                .lastName("Sharma")
                .email("priya@example.com")
                .phone("9876543210")
                .build();
    }

    private Order makeOrder(UUID orderId, UUID userId, BigDecimal amount) {
        User user = makeUser(userId);
        Order order = new Order();
        order.setId(orderId);
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(amount);
        order.setCurrency("INR");
        order.setItems(Set.of());
        order.setCreatedAt(OffsetDateTime.now());
        order.setUpdatedAt(OffsetDateTime.now());
        return order;
    }

    private Payment makePayment(UUID paymentId, Order order, PaymentStatus status, String rzpOrderId) {
        Payment p = new Payment();
        p.setId(paymentId);
        p.setOrder(order);
        p.setStatus(status);
        p.setProvider(PaymentProvider.RAZORPAY);
        p.setPaymentMode(PaymentMode.UPI);
        p.setAmount(order.getTotalAmount());
        p.setCurrency("INR");
        p.setProviderOrderId(rzpOrderId);
        p.setCreatedAt(OffsetDateTime.now());
        p.setUpdatedAt(OffsetDateTime.now());
        return p;
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    // ─── createOrder ─────────────────────────────────────────────────────────

    @Nested
    class CreateOrder {

        @Test
        void creates_new_razorpay_order_when_none_exists() throws RazorpayException {
            UUID userId  = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("500.00"));

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.CREATED))
                    .thenReturn(List.of());

            com.razorpay.Order rzpOrder = new com.razorpay.Order(
                    new JSONObject().put("id", RZP_ORDER));
            when(mockOrders.create(any(JSONObject.class))).thenReturn(rzpOrder);

            Payment savedPayment = makePayment(UUID.randomUUID(), order, PaymentStatus.CREATED, RZP_ORDER);
            when(paymentRepository.save(any())).thenReturn(savedPayment);

            InitiatePaymentRequest req = new InitiatePaymentRequest();
            req.setOrderId(orderId);
            RazorpayOrderResponse resp = razorpayService.createOrder(userId, req);

            assertThat(resp.getRazorpayOrderId()).isEqualTo(RZP_ORDER);
            assertThat(resp.getCurrency()).isEqualTo("INR");
            assertThat(resp.getAmountInPaisa()).isEqualTo(50000L); // 500.00 * 100
            verify(mockOrders).create(any(JSONObject.class));
            verify(paymentRepository).save(any(Payment.class));
        }

        @Test
        void reuses_existing_created_payment_for_same_order() throws RazorpayException {
            UUID userId   = UUID.randomUUID();
            UUID orderId  = UUID.randomUUID();
            UUID payId    = UUID.randomUUID();
            Order order   = makeOrder(orderId, userId, new BigDecimal("200.00"));
            Payment existing = makePayment(payId, order, PaymentStatus.CREATED, RZP_ORDER);

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(paymentRepository.findByOrderIdAndStatus(orderId, PaymentStatus.CREATED))
                    .thenReturn(List.of(existing));

            InitiatePaymentRequest req = new InitiatePaymentRequest();
            req.setOrderId(orderId);
            RazorpayOrderResponse resp = razorpayService.createOrder(userId, req);

            assertThat(resp.getRazorpayOrderId()).isEqualTo(RZP_ORDER);
            assertThat(resp.getInternalPaymentId()).isEqualTo(payId);
            // Razorpay API must NOT be called again
            verify(mockOrders, never()).create(any());
        }

        @Test
        void throws_BadRequest_when_order_is_cancelled() {
            UUID userId  = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("100.00"));
            order.setStatus(OrderStatus.CANCELLED);

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            InitiatePaymentRequest req = new InitiatePaymentRequest();
            req.setOrderId(orderId);

            assertThatThrownBy(() -> razorpayService.createOrder(userId, req))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("cancelled");
        }

        @Test
        void throws_BadRequest_when_order_belongs_to_different_user() {
            UUID userId      = UUID.randomUUID();
            UUID otherUserId = UUID.randomUUID();
            UUID orderId     = UUID.randomUUID();
            Order order      = makeOrder(orderId, otherUserId, new BigDecimal("100.00"));

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

            InitiatePaymentRequest req = new InitiatePaymentRequest();
            req.setOrderId(orderId);

            assertThatThrownBy(() -> razorpayService.createOrder(userId, req))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ─── verifyAndCapture ────────────────────────────────────────────────────

    @Nested
    class VerifyAndCapture {

        @Test
        void captures_payment_and_confirms_order_on_valid_signature() throws Exception {
            UUID payId   = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            UUID userId  = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("300.00"));
            Payment pay  = makePayment(payId, order, PaymentStatus.CREATED, RZP_ORDER);

            String sig = hmacSha256(RZP_ORDER + "|" + RZP_PAY, KEY_SECRET);

            when(paymentRepository.findById(payId)).thenReturn(Optional.of(pay));

            com.razorpay.Payment rzpPay = new com.razorpay.Payment(
                    new JSONObject().put("id", RZP_PAY).put("method", "card"));
            when(mockPayments.fetch(RZP_PAY)).thenReturn(rzpPay);
            when(paymentRepository.save(any())).thenReturn(pay);
            when(orderRepository.save(any())).thenReturn(order);

            VerifyPaymentRequest req = new VerifyPaymentRequest(payId, RZP_PAY, RZP_ORDER, sig);
            razorpayService.verifyAndCapture(req);

            ArgumentCaptor<Payment> payCaptor = ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, atLeastOnce()).save(payCaptor.capture());
            assertThat(payCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.CAPTURED);
            assertThat(payCaptor.getValue().getPaymentMode()).isEqualTo(PaymentMode.CREDIT_CARD);

            ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
            verify(orderRepository).save(orderCaptor.capture());
            assertThat(orderCaptor.getValue().getStatus()).isEqualTo(OrderStatus.CONFIRMED);

            verify(emailService).sendOrderConfirmationEmail(
                    eq("priya@example.com"), anyString(), eq(orderId.toString()),
                    anyList(), any(), anyString());
        }

        @Test
        void throws_BadRequest_on_signature_mismatch() {
            UUID payId = UUID.randomUUID();

            VerifyPaymentRequest req = new VerifyPaymentRequest(payId, RZP_PAY, RZP_ORDER, "badsignature");

            assertThatThrownBy(() -> razorpayService.verifyAndCapture(req))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("signature");
        }

        @Test
        void is_idempotent_when_payment_already_captured() throws Exception {
            UUID payId   = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            UUID userId  = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("100.00"));
            Payment pay  = makePayment(payId, order, PaymentStatus.CAPTURED, RZP_ORDER);
            pay.setProviderPaymentId(RZP_PAY);

            String sig = hmacSha256(RZP_ORDER + "|" + RZP_PAY, KEY_SECRET);
            when(paymentRepository.findById(payId)).thenReturn(Optional.of(pay));

            VerifyPaymentRequest req = new VerifyPaymentRequest(payId, RZP_PAY, RZP_ORDER, sig);
            razorpayService.verifyAndCapture(req);

            // No saves or emails — already processed
            verify(paymentRepository, never()).save(any());
            verify(emailService, never()).sendOrderConfirmationEmail(any(), any(), any(), any(), any(), any());
        }
    }

    // ─── handleWebhook ───────────────────────────────────────────────────────

    @Nested
    class HandleWebhook {

        @Test
        void rejects_webhook_with_invalid_hmac_when_secret_configured() {
            when(props.getWebhookSecret()).thenReturn("realwebhooksecret");

            String payload = "{\"event\":\"payment.captured\"}";
            assertThatThrownBy(() -> razorpayService.handleWebhook(payload, "badsig"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("signature");
        }

        @Test
        void skips_hmac_check_when_secret_not_configured() {
            when(props.getWebhookSecret()).thenReturn("");

            String payload = buildCapturedPayload();
            // No payment found → no-op, but should not throw on signature
            when(paymentRepository.findByProviderOrderId(any())).thenReturn(Optional.empty());

            razorpayService.handleWebhook(payload, "any-sig-here");
            // No exception = signature check was skipped ✓
        }

        @Test
        void payment_captured_event_marks_payment_captured_and_confirms_order() throws Exception {
            UUID payId   = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            UUID userId  = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("400.00"));
            Payment pay  = makePayment(payId, order, PaymentStatus.CREATED, RZP_ORDER);

            when(paymentRepository.findByProviderOrderId(RZP_ORDER)).thenReturn(Optional.of(pay));
            when(paymentRepository.save(any())).thenReturn(pay);
            when(orderRepository.save(any())).thenReturn(order);

            razorpayService.handleWebhook(buildCapturedPayload(), "");

            ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, atLeastOnce()).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(PaymentStatus.CAPTURED);
            assertThat(captor.getValue().getProviderPaymentId()).isEqualTo(RZP_PAY);

            verify(orderRepository).save(argThat(o -> o.getStatus() == OrderStatus.CONFIRMED));
            verify(emailService).sendOrderConfirmationEmail(any(), any(), any(), any(), any(), any());
            verify(shiprocketService).createShiprocketOrder(order);
        }

        @Test
        void payment_captured_is_idempotent_when_already_captured() {
            UUID payId   = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            UUID userId  = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("100.00"));
            Payment pay  = makePayment(payId, order, PaymentStatus.CAPTURED, RZP_ORDER);

            when(paymentRepository.findByProviderOrderId(RZP_ORDER)).thenReturn(Optional.of(pay));
            // No save calls expected — payment already CAPTURED, capturePayment is skipped

            razorpayService.handleWebhook(buildCapturedPayload(), "");

            // Status already CAPTURED — no additional save/email
            verify(emailService, never()).sendOrderConfirmationEmail(any(), any(), any(), any(), any(), any());
            // Shiprocket push still fires (idempotent there)
            verify(shiprocketService).createShiprocketOrder(order);
        }

        @Test
        void payment_failed_event_cancels_order_and_restores_inventory() {
            UUID payId    = UUID.randomUUID();
            UUID orderId  = UUID.randomUUID();
            UUID userId   = UUID.randomUUID();
            UUID varId    = UUID.randomUUID();
            Order order   = makeOrder(orderId, userId, new BigDecimal("200.00"));
            Payment pay   = makePayment(payId, order, PaymentStatus.CREATED, RZP_ORDER);

            // One order item with inventory
            com.ascendons.catalog.entity.ProductVariant variant =
                    com.ascendons.catalog.entity.ProductVariant.builder()
                            .id(varId).sku("SKU-001").build();
            OrderItem item = OrderItem.builder()
                    .id(UUID.randomUUID()).order(order).productVariant(variant)
                    .quantity(2).price(new BigDecimal("100.00")).build();
            order.setItems(Set.of(item));

            Inventory inv = new Inventory();
            inv.setQuantity(10);

            when(paymentRepository.findByProviderOrderId(RZP_ORDER)).thenReturn(Optional.of(pay));
            when(paymentRepository.save(any())).thenReturn(pay);
            when(orderRepository.save(any())).thenReturn(order);
            when(inventoryRepository.findByIdForUpdate(varId)).thenReturn(Optional.of(inv));
            when(inventoryRepository.save(any())).thenReturn(inv);

            razorpayService.handleWebhook(buildFailedPayload(), "");

            // Payment marked FAILED
            ArgumentCaptor<Payment> payCaptor = ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository).save(payCaptor.capture());
            assertThat(payCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.FAILED);

            // Order CANCELLED
            verify(orderRepository, atLeastOnce()).save(argThat(o -> o.getStatus() == OrderStatus.CANCELLED));

            // Inventory restored
            assertThat(inv.getQuantity()).isEqualTo(12); // 10 + 2
            verify(movementRepository).save(any());

            // Cancellation email sent
            verify(emailService).sendOrderCancelledEmail(
                    eq("priya@example.com"), anyString(), eq(orderId.toString()), anyString());
        }

        @Test
        void order_paid_event_captures_payment() {
            UUID payId   = UUID.randomUUID();
            UUID orderId = UUID.randomUUID();
            UUID userId  = UUID.randomUUID();
            Order order  = makeOrder(orderId, userId, new BigDecimal("150.00"));
            Payment pay  = makePayment(payId, order, PaymentStatus.CREATED, RZP_ORDER);

            when(paymentRepository.findByProviderOrderId(RZP_ORDER)).thenReturn(Optional.of(pay));
            when(paymentRepository.save(any())).thenReturn(pay);
            when(orderRepository.save(any())).thenReturn(order);

            razorpayService.handleWebhook(buildOrderPaidPayload(), "");

            verify(paymentRepository).save(argThat(p -> p.getStatus() == PaymentStatus.CAPTURED));
        }

        @Test
        void unknown_event_is_silently_ignored() {
            String payload = "{\"event\":\"unknown.event\"}";
            // No exceptions; no repo calls
            razorpayService.handleWebhook(payload, "");
            verifyNoInteractions(paymentRepository, orderRepository);
        }

        // ── Payload builders ──────────────────────────────────────────────────

        private String buildCapturedPayload() {
            return """
                    {
                      "event": "payment.captured",
                      "payload": {
                        "payment": {
                          "entity": {
                            "id": "%s",
                            "order_id": "%s",
                            "method": "upi"
                          }
                        }
                      }
                    }
                    """.formatted(RZP_PAY, RZP_ORDER);
        }

        private String buildFailedPayload() {
            return """
                    {
                      "event": "payment.failed",
                      "payload": {
                        "payment": {
                          "entity": {
                            "id": "%s",
                            "order_id": "%s",
                            "error_description": "Insufficient funds"
                          }
                        }
                      }
                    }
                    """.formatted(RZP_PAY, RZP_ORDER);
        }

        private String buildOrderPaidPayload() {
            return """
                    {
                      "event": "order.paid",
                      "payload": {
                        "order": {
                          "entity": { "id": "%s" }
                        },
                        "payment": {
                          "entity": { "id": "%s", "method": "card" }
                        }
                      }
                    }
                    """.formatted(RZP_ORDER, RZP_PAY);
        }
    }
}
