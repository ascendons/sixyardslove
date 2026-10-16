package com.ascendons.order.mapper;

import com.ascendons.order.dto.OrderResponse;
import com.ascendons.order.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = { OrderItemMapper.class, PaymentMapper.class, OrderBoxAssignmentMapper.class, ShipmentMapper.class, com.ascendons.user.mapper.UserAddressMapper.class })
public interface OrderMapper {
    @Mapping(target = "orderNumber", expression = "java(order.getId().toString().substring(0,8).toUpperCase())")
    @Mapping(target = "invoiceNumber", expression = "java(formatInvoiceNumber(order))")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "addressId", source = "address.id")
    @Mapping(target = "status", expression = "java(order.getStatus().name())")
    @Mapping(target = "customerName", expression = "java(order.getUser().getFirstName() + \" \" + (order.getUser().getLastName() != null ? order.getUser().getLastName() : \"\"))")
    @Mapping(target = "paymentId", expression = "java(order.getPayments().isEmpty() ? null : order.getPayments().iterator().next().getId().toString())")
    @Mapping(target = "shippingId", expression = "java(order.getShipments().isEmpty() ? null : order.getShipments().get(0).getId().toString())")
    OrderResponse toResponse(Order order);

    /** Orders created before invoice_seq existed have no sequential number — fall back to the old UUID-derived one. */
    default String formatInvoiceNumber(Order order) {
        return order.getInvoiceSeq() != null
                ? String.format("Six Yards Love/I-%06d", order.getInvoiceSeq())
                : order.getId().toString().substring(0, 8).toUpperCase();
    }
}
