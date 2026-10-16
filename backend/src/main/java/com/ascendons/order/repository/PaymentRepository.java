package com.ascendons.order.repository;

import com.ascendons.order.entity.Payment;
import com.ascendons.order.entity.PaymentProvider;
import com.ascendons.order.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByOrderId(UUID orderId);

    Optional<Payment> findByProviderPaymentId(String providerPaymentId);

    Optional<Payment> findByProviderOrderId(String providerOrderId);

    List<Payment> findByOrderIdAndStatus(UUID orderId, PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE "
            + "(:status IS NULL OR p.status = :status) AND "
            + "(:provider IS NULL OR p.provider = :provider)")
    Page<Payment> findAllWithFilters(
            @Param("status") PaymentStatus status,
            @Param("provider") PaymentProvider provider,
            Pageable pageable);

    // All Razorpay-initiated payments within a date range, used by the audit endpoint.
    @Query("SELECT p FROM Payment p WHERE p.provider = :provider " +
           "AND p.providerOrderId IS NOT NULL " +
           "AND p.createdAt >= :from AND p.createdAt <= :to " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findRazorpayPaymentsInRange(
            @Param("provider") PaymentProvider provider,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    // Payments that Razorpay may have settled but we haven't reflected yet.
    // Excludes very recent payments (within `before`) to avoid racing with the
    // webhook/verify flow that normally handles captures in real time.
    @Query("SELECT p FROM Payment p JOIN FETCH p.order WHERE p.provider = :provider " +
           "AND p.status IN :statuses AND p.providerOrderId IS NOT NULL " +
           "AND p.createdAt < :before")
    List<Payment> findStalePendingPayments(
            @Param("provider") PaymentProvider provider,
            @Param("statuses") List<PaymentStatus> statuses,
            @Param("before") OffsetDateTime before);
}
