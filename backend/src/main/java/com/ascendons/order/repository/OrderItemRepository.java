package com.ascendons.order.repository;

import com.ascendons.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrderId(UUID orderId);

    /** Eagerly loads productVariant + product to avoid N+1 when mapping OrderItem → OrderItemResponse */
    @Query("SELECT oi FROM OrderItem oi LEFT JOIN FETCH oi.productVariant pv LEFT JOIN FETCH pv.product LEFT JOIN FETCH pv.inventory WHERE oi.order.id = :orderId")
    List<OrderItem> findByOrderIdWithDetails(@Param("orderId") UUID orderId);
}
