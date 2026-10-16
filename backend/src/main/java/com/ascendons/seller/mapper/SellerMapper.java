package com.ascendons.seller.mapper;

import com.ascendons.seller.dto.SellerResponse;
import com.ascendons.seller.entity.Seller;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SellerMapper {
    @Mapping(target = "firstName", source = "user.firstName")
    @Mapping(target = "lastName", source = "user.lastName")
    @Mapping(target = "email", source = "user.email")
    SellerResponse toResponse(Seller seller);
}
