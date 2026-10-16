package com.ascendons.order.repository;

import com.ascendons.order.entity.OrderBoxAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderBoxAssignmentRepository extends JpaRepository<OrderBoxAssignment, UUID> {
    List<OrderBoxAssignment> findByOrderIdOrderBySequenceAsc(UUID orderId);
}