package com.ascendons.user.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.order.repository.OrderRepository;
import com.ascendons.user.dto.AdminCustomerResponse;
import com.ascendons.user.dto.UserAddressResponse;
import com.ascendons.user.entity.Role;
import com.ascendons.user.entity.User;
import com.ascendons.user.mapper.UserAddressMapper;
import com.ascendons.user.repository.UserAddressRepository;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final UserAddressMapper userAddressMapper;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Page<AdminCustomerResponse> getCustomers(String search, Pageable pageable) {
        Page<User> users = (search != null && !search.isBlank())
                ? userRepository.searchCustomers(Role.USER, search.trim(), pageable)
                : userRepository.findByRole(Role.USER, pageable);

        return users.map(u -> toResponse(u, false));
    }

    @Transactional(readOnly = true)
    public AdminCustomerResponse getCustomer(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return toResponse(user, true);
    }

    @Transactional
    public AdminCustomerResponse setActive(UUID id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        user.setIsActive(active);
        return toResponse(userRepository.save(user), false);
    }

    private AdminCustomerResponse toResponse(User user, boolean includeAddresses) {
        long orderCount = orderRepository.countByUserId(user.getId());

        List<UserAddressResponse> addresses = includeAddresses
                ? userAddressRepository.findByUserId(user.getId()).stream()
                        .map(userAddressMapper::toResponse)
                        .collect(Collectors.toList())
                : null;

        return AdminCustomerResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .orderCount(orderCount)
                .addresses(addresses)
                .build();
    }
}
