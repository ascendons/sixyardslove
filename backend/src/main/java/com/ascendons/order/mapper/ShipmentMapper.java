package com.ascendons.order.mapper;

import com.ascendons.order.dto.ShipmentResponse;
import com.ascendons.order.entity.Shipment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ShipmentMapper {
    @Mapping(target = "status", expression = "java(shipment.getStatus() != null ? shipment.getStatus().name() : null)")
    @Mapping(target = "orderId", source = "order.id")
    ShipmentResponse toResponse(Shipment shipment);
}
