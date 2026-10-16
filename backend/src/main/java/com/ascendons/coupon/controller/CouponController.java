package com.ascendons.coupon.controller;

import com.ascendons.coupon.dto.CartItemDTO;
import com.ascendons.coupon.dto.CouponResponse;
import com.ascendons.coupon.dto.CouponValidationResponse;
import com.ascendons.coupon.mapper.CouponMapper;
import com.ascendons.coupon.service.CouponService;
import com.ascendons.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final CouponMapper couponMapper;
    private final JwtUtil jwtUtil;

    @GetMapping("/applicable")
    public ResponseEntity<List<CouponResponse>> getApplicableCoupons(
            @RequestParam UUID productId,
            @RequestParam(required = false) UUID categoryId) {
        return ResponseEntity.ok(couponMapper.toResponseList(
                couponService.getApplicableCouponsForProduct(productId, categoryId)));
    }

    /** Returns ALL public active coupons with an `applicable` flag — used by the product page. */
    @GetMapping("/all")
    public ResponseEntity<List<CouponResponse>> getAllWithApplicability(
            @RequestParam UUID productId,
            @RequestParam(required = false) UUID categoryId) {
        List<CouponResponse> response = couponService
                .getAllCouponsWithApplicability(productId, categoryId)
                .stream()
                .map(entry -> couponMapper.toResponse(entry.getKey(), entry.getValue()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /** Public lookup used to show a coupon's description/details (e.g. on an invoice). */
    @GetMapping("/code/{code}")
    public ResponseEntity<CouponResponse> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(couponMapper.toResponse(couponService.getCouponByCode(code)));
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponValidationResponse> validateCoupon(
            @RequestParam String code,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody List<CartItemDTO> cartItems) {

        UUID userId = null;
        if (authHeader != null && authHeader.length() > 7 && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                userId = jwtUtil.extractUserId(token);
            } else {
                // Invalid or expired token — reject rather than silently falling through to anonymous
                return ResponseEntity.status(401).build();
            }
        }

        return ResponseEntity.ok(couponService.validateCoupon(code, userId, cartItems));
    }
}
