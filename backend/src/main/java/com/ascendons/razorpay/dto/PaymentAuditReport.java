package com.ascendons.razorpay.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class PaymentAuditReport {

    private OffsetDateTime auditedAt;
    private OffsetDateTime rangeFrom;
    private OffsetDateTime rangeTo;
    private int totalChecked;
    private int okCount;
    private int discrepancyCount;
    private int fetchErrorCount;
    private List<DiscrepancyEntry> discrepancies;

    public enum DiscrepancyType {
        /** Local CREATED/AUTHORIZED, but Razorpay already shows the order as paid — capture was missed. */
        STATUS_MISMATCH_UNCAPTURED,
        /** Local CAPTURED, but Razorpay order is not in paid state — our DB may have a phantom capture. */
        STATUS_MISMATCH_PHANTOM_CAPTURE,
        /** Local FAILED, but Razorpay captured the payment — money was collected but order was cancelled. */
        FAILED_BUT_RAZORPAY_PAID,
        /** Local CAPTURED but providerPaymentId is missing — capture record is incomplete. */
        MISSING_PAYMENT_ID,
        /** Amount in our DB differs from Razorpay's amount by more than ₹1 (rounding tolerance). */
        AMOUNT_MISMATCH,
        /** Razorpay API returned an error for this payment — result is inconclusive. */
        RAZORPAY_FETCH_ERROR,
    }

    @Getter
    @Builder
    public static class DiscrepancyEntry {
        private UUID paymentId;
        private UUID orderId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private DiscrepancyType type;
        private String localStatus;
        private String razorpayOrderStatus;
        private BigDecimal localAmountInr;
        private BigDecimal razorpayAmountInr;
        private String detail;
        private OffsetDateTime paymentCreatedAt;
    }
}
