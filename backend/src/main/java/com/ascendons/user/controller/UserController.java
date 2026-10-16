package com.ascendons.user.controller;

import com.ascendons.user.dto.*;
import com.ascendons.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @GetMapping("/me/addresses")
    public ResponseEntity<List<UserAddressResponse>> getAddresses(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.getAddresses(userId));
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<UserAddressResponse> addAddress(
            Authentication authentication,
            @Valid @RequestBody UserAddressRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.addAddress(userId, request));
    }

    @PutMapping("/me/addresses/{addressId}")
    public ResponseEntity<UserAddressResponse> updateAddress(
            Authentication authentication,
            @PathVariable UUID addressId,
            @Valid @RequestBody UserAddressRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.updateAddress(userId, addressId, request));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @PathVariable UUID addressId) {
        UUID userId = UUID.fromString(authentication.getName());
        userService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        userService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }
}
