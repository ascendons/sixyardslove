package com.ascendons.order.service;

import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Cleans up PENDING orders that have expired without receiving payment.
 * Runs every 5 minutes. Expired orders are cancelled and their inventory restored.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PendingOrderCleanupService {

    private final OrderRepository orderRepository;

    @Scheduled(cron = "0 */5 * * * *") // every 5 minutes
    @Transactional
    public void cancelExpiredPendingOrders() {
        List<Order> expired = orderRepository.findExpiredPendingOrders(OrderStatus.PENDING, OffsetDateTime.now());
        if (expired.isEmpty()) return;

        log.info("PendingOrderCleanup: found {} expired PENDING orders to cancel", expired.size());

        for (Order order : expired) {
            try {
                order.setStatus(OrderStatus.CANCELLED);
                order.setInventoryRestored(true); // nothing was deducted yet (PENDING), just mark cancelled
                orderRepository.save(order);
                log.info("PendingOrderCleanup: cancelled expired order {}", order.getId());
            } catch (Exception e) {
                log.error("PendingOrderCleanup: failed to cancel order {}: {}", order.getId(), e.getMessage());
            }
        }
    }
}