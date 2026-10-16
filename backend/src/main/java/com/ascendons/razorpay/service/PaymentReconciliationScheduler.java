package com.ascendons.razorpay.service;

import com.ascendons.order.entity.Payment;
import com.ascendons.order.entity.PaymentProvider;
import com.ascendons.order.entity.PaymentStatus;
import com.ascendons.order.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Polls Razorpay every 15 minutes for payments that are still CREATED/AUTHORIZED
 * locally but may have been settled or failed on Razorpay's side.
 *
 * This is a safety net for cases where the client-side verify call and the
 * payment.captured / payment.failed webhooks both fail to reach us — e.g.
 * network drops, webhook delivery retries exhausted, or the user closing the
 * browser before the verify response arrives.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentReconciliationScheduler {

    // Only check payments older than this to avoid racing with the real-time
    // webhook / verify flow that handles captures within seconds of checkout.
    private static final int GRACE_PERIOD_MINUTES = 10;

    private final PaymentRepository paymentRepository;
    private final RazorpayClient razorpayClient;
    private final RazorpayService razorpayService;

    @Scheduled(fixedDelay = 900_000) // 15 minutes between runs
    public void reconcile() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusMinutes(GRACE_PERIOD_MINUTES);

        List<Payment> stale = paymentRepository.findStalePendingPayments(
                PaymentProvider.RAZORPAY,
                List.of(PaymentStatus.CREATED, PaymentStatus.AUTHORIZED),
                cutoff);

        if (stale.isEmpty()) {
            log.debug("Payment reconciliation: no stale pending payments");
            return;
        }

        log.info("Payment reconciliation: checking {} stale payment(s)", stale.size());
        int captured = 0, failed = 0, skipped = 0;

        for (Payment payment : stale) {
            try {
                switch (reconcileOne(payment)) {
                    case CAPTURED -> captured++;
                    case FAILED   -> failed++;
                    case SKIPPED  -> skipped++;
                }
            } catch (Exception e) {
                log.error("Reconciliation error for payment {} (rzpOrder={}): {}",
                        payment.getId(), payment.getProviderOrderId(), e.getMessage());
            }
        }

        if (captured > 0 || failed > 0) {
            log.info("Payment reconciliation: {} captured, {} failed, {} skipped",
                    captured, failed, skipped);
        } else {
            log.debug("Payment reconciliation: all {} payment(s) still pending", skipped);
        }
    }

    private enum Result { CAPTURED, FAILED, SKIPPED }

    private Result reconcileOne(Payment payment) throws RazorpayException {
        String rzpOrderId = payment.getProviderOrderId();

        com.razorpay.Order rzpOrder = razorpayClient.orders.fetch(rzpOrderId);
        String rzpStatus = rzpOrder.get("status"); // "created" | "attempted" | "paid"

        log.debug("Reconcile payment {} (rzpOrder={}): rzpStatus={}, localStatus={}",
                payment.getId(), rzpOrderId, rzpStatus, payment.getStatus());

        if ("paid".equals(rzpStatus)) {
            return capturePaidOrder(payment, rzpOrderId);
        }

        // "created" or "attempted" — check if our order window has expired
        var order = payment.getOrder();
        if (order.getExpiresAt() != null && OffsetDateTime.now().isAfter(order.getExpiresAt())) {
            log.info("Reconcile: order {} expired — marking payment {} as FAILED",
                    order.getId(), payment.getId());
            razorpayService.reconcileFail(payment,
                    "Order expired — no payment received within the allowed window");
            return Result.FAILED;
        }

        return Result.SKIPPED;
    }

    /**
     * Fetches the payments for a Razorpay order that is already in "paid" state,
     * finds the captured payment, and reflects it locally.
     */
    private Result capturePaidOrder(Payment payment, String rzpOrderId) throws RazorpayException {
        List<com.razorpay.Payment> rzpPayments = razorpayClient.orders.fetchPayments(rzpOrderId);

        for (com.razorpay.Payment rzpPayment : rzpPayments) {
            if ("captured".equals(rzpPayment.get("status"))) {
                String rzpPaymentId = rzpPayment.get("id");
                String method       = rzpPayment.get("method");
                log.info("Reconcile: capturing payment {} (rzpPayment={}) for order {}",
                        payment.getId(), rzpPaymentId, payment.getOrder().getId());
                razorpayService.reconcileCapture(payment, rzpPaymentId, method);
                return Result.CAPTURED;
            }
        }

        // Edge case: Razorpay order is "paid" but no individual payment shows "captured"
        // yet — can happen transiently. Log and retry next cycle.
        log.warn("Reconcile: rzpOrder {} is 'paid' but no captured payment found — will retry next cycle",
                rzpOrderId);
        return Result.SKIPPED;
    }
}
