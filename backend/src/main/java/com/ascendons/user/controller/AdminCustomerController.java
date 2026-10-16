package com.ascendons.user.controller;

import com.ascendons.user.dto.AdminCustomerResponse;
import com.ascendons.user.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/customers")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<AdminCustomerResponse>> getCustomers(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getCustomers(search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminCustomerResponse> getCustomer(@PathVariable UUID id) {
        return ResponseEntity.ok(adminUserService.getCustomer(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminCustomerResponse> setActive(
            @PathVariable UUID id,
            @RequestParam boolean active) {
        return ResponseEntity.ok(adminUserService.setActive(id, active));
    }
}
