package com.ascendons.user.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.user.dto.*;
import com.ascendons.user.entity.User;
import com.ascendons.user.entity.UserAuth;
import com.ascendons.user.entity.UserAddress;
import com.ascendons.user.mapper.UserAddressMapper;
import com.ascendons.user.mapper.UserMapper;
import com.ascendons.user.repository.UserAddressRepository;
import com.ascendons.user.repository.UserAuthRepository;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final UserAuthRepository userAuthRepository;
    private final UserMapper userMapper;
    private final UserAddressMapper userAddressMapper;
    private final PasswordEncoder passwordEncoder;

    public UserProfileResponse getProfile(UUID userId) {
        User user = findUserById(userId);
        return userMapper.toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUserById(userId);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        user = userRepository.save(user);
        return userMapper.toProfileResponse(user);
    }

    public List<UserAddressResponse> getAddresses(UUID userId) {
        return userAddressRepository.findByUserId(userId).stream()
                .map(userAddressMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAddressResponse addAddress(UUID userId, UserAddressRequest request) {
        User user = findUserById(userId);

        UserAddress address = userAddressMapper.toEntity(request);
        address.setUser(user);

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultAddresses(userId);
        }

        address = userAddressRepository.save(address);
        return userAddressMapper.toResponse(address);
    }

    @Transactional
    public UserAddressResponse updateAddress(UUID userId, UUID addressId, UserAddressRequest request) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultAddresses(userId);
        }

        userAddressMapper.updateEntity(request, address);
        address = userAddressRepository.save(address);
        return userAddressMapper.toResponse(address);
    }

    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Address", "id", addressId);
        }

        userAddressRepository.delete(address);
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        UserAuth auth = userAuthRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserAuth", "userId", userId));

        if (!passwordEncoder.matches(request.getOldPassword(), auth.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid old password");
        }

        auth.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAuthRepository.save(auth);
    }

    private void clearDefaultAddresses(UUID userId) {
        userAddressRepository.findByUserId(userId).stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .forEach(a -> {
                    a.setIsDefault(false);
                    userAddressRepository.save(a);
                });
    }
}
