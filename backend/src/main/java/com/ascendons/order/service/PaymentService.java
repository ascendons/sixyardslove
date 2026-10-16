package com.ascendons.order.service;

import com.ascendons.exception.BadRequestException;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.inventory.entity.Inventory;
import com.ascendons.inventory.entity.InventoryMovement;
import com.ascendons.inventory.repository.InventoryMovementRepository;
import com.ascendons.inventory.repository.InventoryRepository;
import com.ascendons.order.dto.PaymentResponse;
import com.ascendons.order.dto.UpdatePaymentStatusRequest;
import com.ascendons.order.entity.*;
import com.ascendons.order.mapper.PaymentMapper;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.PaymentRepository;
import com.ascendons.shiprocket.service.ShiprocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentMapper paymentMapper;
    private final ShiprocketService shiprocketService;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;

    private static final Map<PaymentStatus, Set<PaymentStatus>> VALID_TRANSITIONS = Map.of(
            PaymentStatus.CREATED, Set.of(PaymentStatus.AUTHORIZED, PaymentStatus.FAILED),
            PaymentStatus.AUTHORIZED, Set.of(PaymentStatus.CAPTURED, PaymentStatus.FAILED),
            PaymentStatus.CAPTURED, Set.of(PaymentStatus.REFUNDED),
            PaymentStatus.FAILED, Set.of(),
            PaymentStatus.REFUNDED, Set.of()
    );

    public Page<PaymentResponse> getAllPayments(PaymentStatus status, PaymentProvider provider, Pageable pageable) {
        return paymentRepository.findAllWithFilters(status, provider, pageable)
                .map(paymentMapper::toResponse);
    }

    public PaymentResponse getPaymentById(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        return paymentMapper.toResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByOrderId(UUID orderId) {
        orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return paymentRepository.findByOrderId(orderId).stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Transactional
    public PaymentResponse updatePaymentStatus(UUID paymentId, UpdatePaymentStatusRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        PaymentStatus newStatus;
        try {
            newStatus = PaymentStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment status: " + request.getStatus());
        }

        Set<PaymentStatus> allowed = VALID_TRANSITIONS.get(payment.getStatus());
        if (allowed == null || !allowed.contains(newStatus)) {
            throw new BadRequestException(
                    "Cannot transition from " + payment.getStatus() + " to " + newStatus);
        }

        payment.setStatus(newStatus);

        if (request.getProviderPaymentId() != null) {
            payment.setProviderPaymentId(request.getProviderPaymentId());
        }
        if (request.getProviderSignature() != null) {
            payment.setProviderSignature(request.getProviderSignature());
        }

        if (newStatus == PaymentStatus.CAPTURED) {
            payment.setPaidAt(OffsetDateTime.now());
            try {
                shiprocketService.createShiprocketOrder(payment.getOrder());
            } catch (Exception e) {
                // Log but don't fail the payment capture — Shiprocket can be retried manually
                log.error("Failed to create Shiprocket order for order {}: {}",
                        payment.getOrder().getId(), e.getMessage(), e);
            }
        }

        if (newStatus == PaymentStatus.FAILED) {
            if (request.getFailureReason() != null) {
                payment.setFailureReason(request.getFailureReason());
            }
            Order failedOrder = payment.getOrder();
            if (!Boolean.TRUE.equals(failedOrder.getInventoryRestored())) {
                failedOrder.setInventoryRestored(true);
                orderRepository.save(failedOrder);
                failedOrder.getItems().forEach(item -> {
                    inventoryRepository.findByIdForUpdate(item.getProductVariant().getId()).ifPresent(inv -> {
                        inv.setQuantity(inv.getQuantity() + item.getQuantity());
                        inventoryRepository.save(inv);
                        movementRepository.save(InventoryMovement.builder()
                                .productVariant(item.getProductVariant())
                                .changeQty(item.getQuantity())
                                .reason("Payment failed, inventory released: " + failedOrder.getId())
                                .build());
                    });
                });
            }
        }

        payment = paymentRepository.save(payment);
        return paymentMapper.toResponse(payment);
    }
}
