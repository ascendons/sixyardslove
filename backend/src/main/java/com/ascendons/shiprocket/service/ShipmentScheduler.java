package com.ascendons.shiprocket.service;

import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.order.entity.Shipment;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ShipmentScheduler {

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShiprocketService shiprocketService;

    // PAUSED: Shiprocket auto-push disabled — orders are fulfilled manually via admin tracking entry
    // @Scheduled(fixedDelayString = "${app.shiprocket.scheduler.interval:3600000}")
    public void autoPushPendingShipments() {
        try {
            List<Order> pending = orderRepository.findByStatusWithNoShipment(OrderStatus.CONFIRMED);
            if (pending.isEmpty()) {
                log.debug("No pending orders to push to Shiprocket");
                return;
            }
            log.info("Auto-pushing {} confirmed orders without shipment to Shiprocket", pending.size());

            int pushed = 0, failed = 0;
            for (Order order : pending) {
                try {
                    shiprocketService.createShiprocketOrder(order);
                    pushed++;
                } catch (Exception e) {
                    log.warn("Failed to auto-push order {} to Shiprocket: {}", order.getId(), e.getMessage());
                    failed++;
                }
            }
            log.info("Auto-push results: {} pushed, {} failed out of {} orders", pushed, failed, pending.size());
        } catch (Exception e) {
            log.error("Error in autoPushPendingShipments scheduler: {}", e.getMessage(), e);
        }
    }

    // PAUSED: Shiprocket AWB retry disabled — orders are fulfilled manually via admin tracking entry
    // @Scheduled(fixedDelay = 1_800_000)
    public void retryPendingAwbAssignments() {
        try {
            List<Shipment> pending = shipmentRepository.findShipmentsAwaitingAwb();
            if (pending.isEmpty()) {
                log.debug("No shipments awaiting AWB assignment");
                return;
            }
            log.info("Retrying AWB assignment for {} shipment(s)", pending.size());
            for (Shipment shipment : pending) {
                try {
                    shiprocketService.createShiprocketOrder(shipment.getOrder());
                } catch (Exception e) {
                    log.warn("AWB retry failed for shipment {} (order {}): {}",
                            shipment.getId(), shipment.getOrder().getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error in retryPendingAwbAssignments scheduler: {}", e.getMessage(), e);
        }
    }
}
