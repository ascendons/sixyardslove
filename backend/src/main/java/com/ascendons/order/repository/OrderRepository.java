package com.ascendons.order.repository;

import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUserId(UUID userId, Pageable pageable);
    Page<Order> findByIsBulkTrue(Pageable pageable);
    long countByUserId(UUID userId);
    long countByUserIdAndCouponCode(UUID userId, String couponCode);
    long countByCouponCode(String couponCode);
    long countByStatus(OrderStatus status);

    /** Acquires a row-level write lock — use in cancellation/failure paths to prevent concurrent double-restoration. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"payments", "shipments", "items", "items.productVariant", "items.productVariant.product"})
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithPaymentsAndShipments(@Param("id") UUID id);

    /** Returns PENDING orders past their expiresAt timestamp. */
    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.expiresAt IS NOT NULL AND o.expiresAt < :now")
    List<Order> findExpiredPendingOrders(@Param("status") OrderStatus status, @Param("now") OffsetDateTime now);

    /** Returns CONFIRMED orders that have no shipment record yet. */
    @Query("SELECT o FROM Order o WHERE o.status = :status AND SIZE(o.shipments) = 0")
    List<Order> findByStatusWithNoShipment(@Param("status") OrderStatus status);

    /** Orders with a coupon discount applied — candidates for the discounted-item-tax backfill. */
    @EntityGraph(attributePaths = {"items"})
    List<Order> findByCouponDiscountGreaterThan(BigDecimal amount);


    /** Atomically pulls the next value from orders_invoice_seq — safe under concurrent order creation. */
    @Query(value = "SELECT nextval('orders_invoice_seq')", nativeQuery = true)
    Long nextInvoiceSeq();

    /** Total revenue: sum of totalAmount for all non-cancelled orders. */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status != com.ascendons.order.entity.OrderStatus.CANCELLED")
    BigDecimal sumRevenueExcludingCancelled();

    /** Revenue in a date range for non-cancelled orders. */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status != com.ascendons.order.entity.OrderStatus.CANCELLED AND o.createdAt >= :from AND o.createdAt <= :to")
    BigDecimal sumRevenueBetween(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);
}
