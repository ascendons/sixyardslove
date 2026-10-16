package com.ascendons.cart.mapper;

import com.ascendons.cart.dto.CartResponse;
import com.ascendons.cart.entity.Cart;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {CartItemMapper.class})
public interface CartMapper {
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "totalAmount", ignore = true)
    @Mapping(target = "currency", ignore = true)
    CartResponse toResponse(Cart cart);
}
