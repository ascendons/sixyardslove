package com.ascendons.user.mapper;

import com.ascendons.user.dto.UserAddressRequest;
import com.ascendons.user.dto.UserAddressResponse;
import com.ascendons.user.entity.UserAddress;
import org.springframework.stereotype.Component;

@Component
public class UserAddressMapper {

    public UserAddressResponse toResponse(UserAddress address) {
        if (address == null) return null;
        return UserAddressResponse.builder()
                .id(address.getId())
                .label(address.getLabel())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .pincode(address.getPostalCode())   // alias for frontend
                .addressType(address.getAddressType())
                .landmark(address.getLandmark())
                .alternatePhone(address.getAlternatePhone())
                .isDefault(address.getIsDefault())
                .build();
    }

    public UserAddress toEntity(UserAddressRequest request) {
        if (request == null) return null;
        UserAddress address = new UserAddress();
        applyRequest(request, address);
        return address;
    }

    public void updateEntity(UserAddressRequest request, UserAddress address) {
        applyRequest(request, address);
    }

    private void applyRequest(UserAddressRequest request, UserAddress address) {
        address.setLabel(request.getLabel());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());

        // Accept pincode (frontend) or postalCode (direct API) interchangeably
        String code = request.getPincode() != null ? request.getPincode() : request.getPostalCode();
        address.setPostalCode(code);

        // Default country to India if not provided (most users are India-based)
        String country = (request.getCountry() != null && !request.getCountry().isBlank())
                ? request.getCountry() : "India";
        address.setCountry(country);

        address.setAddressType(request.getAddressType());
        address.setLandmark(request.getLandmark());
        address.setAlternatePhone(request.getAlternatePhone());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);
    }
}
