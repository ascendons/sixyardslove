package com.ascendons.razorpay.controller;

import com.ascendons.razorpay.dto.InitiatePaymentRequest;
import com.ascendons.razorpay.dto.RazorpayOrderResponse;
import com.ascendons.razorpay.dto.VerifyPaymentRequest;
import com.ascendons.razorpay.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments/razorpay")
@RequiredArgsConstructor
public class RazorpayController {

    private final RazorpayService razorpayService;

    /** Step 1: Create a Razorpay order for an existing internal order. */
    @PostMapping("/create-order")
    public ResponseEntity<RazorpayOrderResponse> createOrder(
            Authentication authentication,
            @Valid @RequestBody InitiatePaymentRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(razorpayService.createOrder(userId, request));
    }

    /** Step 2: Verify client-side payment signature and mark as captured. */
    @PostMapping("/verify")
    public ResponseEntity<Void> verifyPayment(
            Authentication authentication,
            @Valid @RequestBody VerifyPaymentRequest request) {
        // userId implicitly validated inside service (ownership check)
        razorpayService.verifyAndCapture(request);
        return ResponseEntity.ok().build();
    }
}
