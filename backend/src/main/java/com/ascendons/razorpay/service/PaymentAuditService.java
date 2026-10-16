package com.ascendons.razorpay.service;

import com.ascendons.exception.BadRequestException;
import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.Payment;
import com.ascendons.order.entity.PaymentProvider;
import com.ascendons.order.entity.PaymentStatus;
import com.ascendons.order.repository.PaymentRepository;
import com.ascendons.razorpay.dto.PaymentAuditReport;
import com.ascendons.razorpay.dto.PaymentAuditReport.DiscrepancyEntry;
import com.ascendons.razorpay.dto.PaymentAuditReport.DiscrepancyType;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentAuditService {

    private static final int MAX_RANGE_DAYS = 90;
    // Tolerate up to ₹1 rounding difference caused by exchange rate division
    private static final BigDecimal AMOUNT_TOLERANCE_INR = BigDecimal.ONE;
    private static final Set<PaymentStatus> PENDING_STATUSES =
            Set.of(PaymentStatus.CREATED, PaymentStatus.AUTHORIZED);

    private final PaymentRepository paymentRepository;
    private final RazorpayClient razorpayClient;

    public PaymentAuditReport audit(OffsetDateTime from, OffsetDateTime to) {
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new BadRequestException(
                    "Audit range cannot exceed " + MAX_RANGE_DAYS + " days. Use a narrower from/to window.");
        }

        List<Payment> payments = paymentRepository.findRazorpayPaymentsInRange(
                PaymentProvider.RAZORPAY, from, to);

        log.info("Payment audit: checking {} Razorpay payment(s) between {} and {}", payments.size(), from, to);

        List<DiscrepancyEntry> discrepancies = new ArrayList<>();
        int okCount = 0, fetchErrors = 0;

        for (Payment payment : payments) {
            try {
                DiscrepancyEntry entry = checkOne(payment);
                if (entry == null) {
                    okCount++;
                } else {
                    discrepancies.add(entry);
                    if (entry.getType() == DiscrepancyType.RAZORPAY_FETCH_ERROR) fetchErrors++;
                }
            } catch (RazorpayException e) {
                log.warn("Audit fetch error for payment {} (rzpOrder={}): {}",
                        payment.getId(), payment.getProviderOrderId(), e.getMessage());
                discrepancies.add(DiscrepancyEntry.builder()
                        .paymentId(payment.getId())
                        .orderId(payment.getOrder().getId())
                        .razorpayOrderId(payment.getProviderOrderId())
                        .razorpayPaymentId(payment.getProviderPaymentId())
                        .type(DiscrepancyType.RAZORPAY_FETCH_ERROR)
                        .localStatus(payment.getStatus().name())
                        .detail("Razorpay API error: " + e.getMessage())
                        .localAmountInr(localAmountInr(payment))
                        .paymentCreatedAt(payment.getCreatedAt())
                        .build());
                fetchErrors++;
            }
        }

        int trueDiscrepancies = discrepancies.size() - fetchErrors;
        log.info("Payment audit complete: {} ok, {} discrepancies, {} fetch errors (total {})",
                okCount, trueDiscrepancies, fetchErrors, payments.size());

        return PaymentAuditReport.builder()
                .auditedAt(OffsetDateTime.now())
                .rangeFrom(from)
                .rangeTo(to)
                .totalChecked(payments.size())
                .okCount(okCount)
                .discrepancyCount(trueDiscrepancies)
                .fetchErrorCount(fetchErrors)
                .discrepancies(discrepancies)
                .build();
    }

    // Returns a DiscrepancyEntry if the payment is out of sync, null if everything looks fine.
    private DiscrepancyEntry checkOne(Payment payment) throws RazorpayException {
        PaymentStatus localStatus = payment.getStatus();

        // Guard: no Razorpay order ID means the order was never sent to Razorpay yet
        if (payment.getProviderOrderId() == null) {
            if (localStatus == PaymentStatus.CAPTURED) {
                return discrepancy(payment, DiscrepancyType.MISSING_PAYMENT_ID, null, null,
                        "CAPTURED payment has no Razorpay order ID");
            }
            return null;
        }

        // CAPTURED with no payment ID is always a data integrity issue
        if (localStatus == PaymentStatus.CAPTURED && payment.getProviderPaymentId() == null) {
            return discrepancy(payment, DiscrepancyType.MISSING_PAYMENT_ID, null, null,
                    "CAPTURED payment is missing providerPaymentId");
        }

        // Skip refunded — Razorpay order stays "paid" after a refund; there is no mismatch to detect
        if (localStatus == PaymentStatus.REFUNDED) {
            return null;
        }

        com.razorpay.Order rzpOrder = razorpayClient.orders.fetch(payment.getProviderOrderId());
        String rzpOrderStatus = rzpOrder.get("status"); // "created" | "attempted" | "paid"
        BigDecimal rzpAmountInr = paisaToInr(rzpOrder.get("amount"));

        // Pending locally but Razorpay already collected money → we missed the capture
        if (PENDING_STATUSES.contains(localStatus) && "paid".equals(rzpOrderStatus)) {
            return discrepancy(payment, DiscrepancyType.STATUS_MISMATCH_UNCAPTURED, rzpOrderStatus, rzpAmountInr,
                    "Razorpay order is 'paid' but local payment is still " + localStatus
                            + " — payment was collected but never reflected in Six Yards Love");
        }

        // Captured locally but Razorpay disagrees → something is wrong with our capture record
        if (localStatus == PaymentStatus.CAPTURED && !"paid".equals(rzpOrderStatus)) {
            return discrepancy(payment, DiscrepancyType.STATUS_MISMATCH_PHANTOM_CAPTURE, rzpOrderStatus, rzpAmountInr,
                    "Local payment is CAPTURED but Razorpay order status is '"
                            + rzpOrderStatus + "' — capture may be phantom");
        }

        // Failed locally but Razorpay captured the money → customer was charged but order was cancelled
        if (localStatus == PaymentStatus.FAILED && "paid".equals(rzpOrderStatus)) {
            return discrepancy(payment, DiscrepancyType.FAILED_BUT_RAZORPAY_PAID, rzpOrderStatus, rzpAmountInr,
                    "Local payment is FAILED but Razorpay order is 'paid'"
                            + " — funds were collected; a refund may be needed");
        }

        // Both sides agree payment is captured — cross-check the amount
        if (localStatus == PaymentStatus.CAPTURED && "paid".equals(rzpOrderStatus)) {
            BigDecimal localInr = localAmountInr(payment);
            if (localInr != null && rzpAmountInr.subtract(localInr).abs().compareTo(AMOUNT_TOLERANCE_INR) > 0) {
                return discrepancy(payment, DiscrepancyType.AMOUNT_MISMATCH, rzpOrderStatus, rzpAmountInr,
                        String.format("Amount mismatch: local=₹%.2f, Razorpay=₹%.2f", localInr, rzpAmountInr));
            }
        }

        return null;
    }

    private BigDecimal localAmountInr(Payment payment) {
        try {
            Order order = payment.getOrder();
            BigDecimal rate = (order.getExchangeRate() == null
                    || order.getExchangeRate().compareTo(BigDecimal.ZERO) == 0)
                    ? BigDecimal.ONE : order.getExchangeRate();
            return payment.getAmount().divide(rate, 2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal paisaToInr(Object paisa) {
        if (paisa == null) return BigDecimal.ZERO;
        return new BigDecimal(paisa.toString()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private DiscrepancyEntry discrepancy(Payment payment, DiscrepancyType type,
                                         String rzpOrderStatus, BigDecimal rzpAmountInr,
                                         String detail) {
        return DiscrepancyEntry.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrder().getId())
                .razorpayOrderId(payment.getProviderOrderId())
                .razorpayPaymentId(payment.getProviderPaymentId())
                .type(type)
                .localStatus(payment.getStatus().name())
                .razorpayOrderStatus(rzpOrderStatus)
                .localAmountInr(localAmountInr(payment))
                .razorpayAmountInr(rzpAmountInr)
                .detail(detail)
                .paymentCreatedAt(payment.getCreatedAt())
                .build();
    }
}
