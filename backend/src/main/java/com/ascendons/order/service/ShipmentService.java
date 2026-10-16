package com.ascendons.order.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.order.dto.CreateShipmentRequest;
import com.ascendons.order.dto.ShipmentResponse;
import com.ascendons.order.dto.UpdateShipmentRequest;
import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.Shipment;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.order.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Page<ShipmentResponse> getAllShipments(Pageable pageable) {
        return shipmentRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentById(UUID id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));
        return mapToResponse(shipment);
    }

    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        Shipment shipment = Shipment.builder()
                .order(order)
                .carrier(request.getCarrier())
                .trackingNumber(request.getTrackingNumber())
                .status(request.getStatus())
                .estimatedDelivery(request.getEstimatedDelivery())
                .build();

        Shipment savedShipment = shipmentRepository.save(shipment);
        return mapToResponse(savedShipment);
    }

    @Transactional
    public ShipmentResponse updateShipment(UUID id, UpdateShipmentRequest request) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found"));

        shipment.setCarrier(request.getCarrier());
        shipment.setTrackingNumber(request.getTrackingNumber());
        shipment.setStatus(request.getStatus());
        shipment.setEstimatedDelivery(request.getEstimatedDelivery());
        shipment.setUpdatedAt(OffsetDateTime.now());

        Shipment updatedShipment = shipmentRepository.save(shipment);
        return mapToResponse(updatedShipment);
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        return ShipmentResponse.builder()
                .id(shipment.getId())
                .orderId(shipment.getOrder() != null ? shipment.getOrder().getId() : null)
                .carrier(shipment.getCarrier())
                .trackingNumber(shipment.getTrackingNumber())
                .status(shipment.getStatus() != null ? shipment.getStatus().name() : null)
                .estimatedDelivery(shipment.getEstimatedDelivery())
                .shiprocketOrderId(shipment.getShiprocketOrderId())
                .shiprocketShipmentId(shipment.getShiprocketShipmentId())
                .build();
    }
}
