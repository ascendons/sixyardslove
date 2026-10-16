package com.ascendons.order.mapper;

import com.ascendons.order.dto.PaymentResponse;
import com.ascendons.order.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {
    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "provider", expression = "java(payment.getProvider().name())")
    @Mapping(target = "method", expression = "java(payment.getPaymentMode().name())")
    @Mapping(target = "status", expression = "java(payment.getStatus().name())")
    PaymentResponse toResponse(Payment payment);
}
