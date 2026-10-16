package com.ascendons.order.controller;

import com.ascendons.order.dto.OrderResponse;
import com.ascendons.order.dto.OrderTrackingResponse;
import com.ascendons.order.dto.PlaceOrderRequest;
import com.ascendons.order.dto.BuyNowRequest;
import com.ascendons.order.dto.ReturnRequestRequest;
import com.ascendons.order.service.InvoiceService;
import com.ascendons.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            Authentication authentication,
            @Valid @RequestBody PlaceOrderRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(userId, request));
    }

    @PostMapping("/buy-now")
    public ResponseEntity<OrderResponse> placeBuyNowOrder(
            Authentication authentication,
            @Valid @RequestBody BuyNowRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeBuyNowOrder(userId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "this_year") String filter) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(orderService.getUserOrders(userId, filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            Authentication authentication,
            @PathVariable UUID id) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(orderService.getOrderByIdForUser(id, userId));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(
            Authentication authentication,
            @PathVariable UUID id) {
        UUID userId = UUID.fromString(authentication.getName());
        byte[] pdf = invoiceService.generateForUser(id, userId);
        String filename = "invoice-" + id.toString().substring(0, 8).toUpperCase() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<OrderTrackingResponse> getOrderTracking(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderTracking(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            Authentication authentication,
            @PathVariable UUID id) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(orderService.cancelOrder(id, userId));
    }

    @PostMapping("/{id}/return-request")
    public ResponseEntity<OrderResponse> requestReturn(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody ReturnRequestRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(orderService.requestReturn(id, userId, request.getReason()));
    }
}
