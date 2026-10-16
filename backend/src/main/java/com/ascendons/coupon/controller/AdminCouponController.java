package com.ascendons.coupon.controller;

import com.ascendons.coupon.dto.CouponResponse;
import com.ascendons.coupon.mapper.CouponMapper;
import com.ascendons.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/coupons")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;
    private final CouponMapper couponMapper;

    @GetMapping("/all")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        return ResponseEntity.ok(couponMapper.toResponseList(couponService.getAllCoupons()));
    }

    @PostMapping("/create")
    public ResponseEntity<CouponResponse> createCoupon(@RequestBody com.ascendons.coupon.entity.Coupon coupon) {
        return ResponseEntity.ok(couponMapper.toResponse(couponService.createCoupon(coupon)));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<CouponResponse> updateCoupon(@PathVariable UUID id, @RequestBody com.ascendons.coupon.entity.Coupon coupon) {
        return ResponseEntity.ok(couponMapper.toResponse(couponService.updateCoupon(id, coupon)));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable UUID id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok().build();
    }
}
