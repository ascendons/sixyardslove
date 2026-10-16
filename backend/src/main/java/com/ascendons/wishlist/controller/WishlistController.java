package com.ascendons.wishlist.controller;

import com.ascendons.wishlist.dto.WishlistItemRequest;
import com.ascendons.wishlist.dto.WishlistResponse;
import com.ascendons.wishlist.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @PostMapping("/items")
    public ResponseEntity<WishlistResponse> addItem(
            Authentication authentication,
            @Valid @RequestBody WishlistItemRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(wishlistService.addItem(userId, request));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<Void> removeItem(
            Authentication authentication,
            @PathVariable UUID productId) {
        UUID userId = UUID.fromString(authentication.getName());
        wishlistService.removeItem(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<Boolean> isInWishlist(
            Authentication authentication,
            @PathVariable UUID productId) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(wishlistService.isInWishlist(userId, productId));
    }
}
