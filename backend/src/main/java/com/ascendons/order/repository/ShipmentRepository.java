package com.ascendons.order.repository;

import com.ascendons.order.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
    Optional<Shipment> findByOrderId(UUID orderId);
    Optional<Shipment> findByShiprocketOrderId(Long shiprocketOrderId);

    @Query("SELECT s FROM Shipment s WHERE s.shiprocketShipmentId IS NOT NULL AND (s.trackingNumber IS NULL OR s.trackingNumber = '')")
    List<Shipment> findShipmentsAwaitingAwb();
}
