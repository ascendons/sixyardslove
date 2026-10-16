package com.ascendons.admin.service;

import com.ascendons.admin.dto.AdminResponse;
import com.ascendons.admin.dto.CreateAdminRequest;
import com.ascendons.admin.entity.Admin;
import com.ascendons.admin.mapper.AdminMapper;
import com.ascendons.admin.repository.AdminRepository;
import com.ascendons.exception.BadRequestException;
import com.ascendons.exception.ConflictException;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.user.entity.Role;
import com.ascendons.user.entity.User;
import com.ascendons.user.entity.UserAuth;
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
public class AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminMapper adminMapper;

    public List<AdminResponse> getAllAdmins() {
        return adminRepository.findAll().stream()
                .map(adminMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminResponse createAdmin(CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }

        Role role = Role.ADMIN;
        if (request.getRole() != null) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
                if (role == Role.USER) {
                    throw new BadRequestException("Cannot create admin with USER role");
                }
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + request.getRole());
            }
        }

        // Create user record
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .role(role)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        // Create user auth
        UserAuth userAuth = UserAuth.builder()
                .userId(user.getId())
                .user(user)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        userAuthRepository.save(userAuth);

        // Create admin metadata
        Admin admin = Admin.builder()
                .email(request.getEmail())
                .build();
        admin = adminRepository.save(admin);

        return adminMapper.toResponse(admin);
    }

    @Transactional
    public void deleteAdmin(UUID adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "id", adminId));

        // Also soft-delete the corresponding user
        userRepository.findByEmail(admin.getEmail()).ifPresent(user -> {
            user.setIsActive(false);
            userRepository.save(user);
        });

        adminRepository.delete(admin);
    }
}
