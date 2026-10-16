package com.ascendons.order.controller;

import com.ascendons.order.dto.PaymentResponse;
import com.ascendons.order.dto.UpdatePaymentStatusRequest;
import com.ascendons.order.entity.PaymentProvider;
import com.ascendons.order.entity.PaymentStatus;
import com.ascendons.order.service.PaymentService;
import com.ascendons.razorpay.dto.PaymentAuditReport;
import com.ascendons.razorpay.service.PaymentAuditService;
import com.ascendons.razorpay.service.PaymentReconciliationScheduler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/admin/payments")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentService paymentService;
    private final PaymentAuditService paymentAuditService;
    private final PaymentReconciliationScheduler reconciliationScheduler;

    @GetMapping
    public ResponseEntity<Page<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentProvider provider,
            Pageable pageable) {
        return ResponseEntity.ok(paymentService.getAllPayments(status, provider, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PaymentResponse> updatePaymentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentStatusRequest request) {
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, request));
    }

    /** Manually triggers the Razorpay payment reconciliation job that normally runs every 15 minutes. */
    @PostMapping("/reconcile/razorpay")
    public ResponseEntity<Void> triggerReconciliation() {
        reconciliationScheduler.reconcile();
        return ResponseEntity.ok().build();
    }

    /**
     * Cross-checks every Razorpay payment in the given window against Razorpay's API
     * and returns a report of any status, amount, or data-integrity discrepancies.
     *
     * Defaults to the last 30 days. Maximum window is 90 days.
     * Each payment makes one Razorpay API call, so keep the window focused for speed.
     */
    @GetMapping("/audit/razorpay")
    public ResponseEntity<PaymentAuditReport> auditRazorpay(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        OffsetDateTime effectiveTo   = to   != null ? to   : OffsetDateTime.now();
        OffsetDateTime effectiveFrom = from != null ? from : effectiveTo.minusDays(30);
        return ResponseEntity.ok(paymentAuditService.audit(effectiveFrom, effectiveTo));
    }
}
