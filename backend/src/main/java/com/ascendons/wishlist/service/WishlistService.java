package com.ascendons.wishlist.service;

import com.ascendons.catalog.entity.Product;
import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.user.entity.User;
import com.ascendons.user.repository.UserRepository;
import com.ascendons.wishlist.dto.WishlistItemRequest;
import com.ascendons.wishlist.dto.WishlistResponse;
import com.ascendons.wishlist.dto.WishlistItemResponse;
import com.ascendons.wishlist.entity.Wishlist;
import com.ascendons.wishlist.entity.WishlistItem;
import com.ascendons.wishlist.repository.WishlistItemRepository;
import com.ascendons.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public WishlistResponse getWishlist(UUID userId) {
        Wishlist wishlist = getOrCreateWishlist(userId);
        return mapToResponse(wishlist);
    }

    @Transactional
    public WishlistResponse addItem(UUID userId, WishlistItemRequest request) {
        Wishlist wishlist = getOrCreateWishlist(userId);

        boolean alreadyExists = wishlistItemRepository.findActiveByUserIdAndProductId(userId, request.getProductId()).isPresent();
        if (!alreadyExists) {
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

            WishlistItem item = WishlistItem.builder()
                    .wishlist(wishlist)
                    .product(product)
                    .build();
            wishlistItemRepository.save(item);
        }

        return getWishlist(userId);
    }

    @Transactional
    public void removeItem(UUID userId, UUID productId) {
        wishlistItemRepository.softDeleteByUserIdAndProductId(userId, productId);
    }

    public boolean isInWishlist(UUID userId, UUID productId) {
        return wishlistItemRepository.findActiveByUserIdAndProductId(userId, productId).isPresent();
    }

    private Wishlist getOrCreateWishlist(UUID userId) {
        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    Wishlist wishlist = Wishlist.builder()
                            .user(user)
                            .build();
                    return wishlistRepository.save(wishlist);
                });
    }

    private WishlistResponse mapToResponse(Wishlist wishlist) {
        WishlistResponse response = new WishlistResponse();
        response.setId(wishlist.getId());
        response.setItems(wishlist.getItems().stream()
                .map(item -> {
                    WishlistItemResponse itemResponse = new WishlistItemResponse();
                    itemResponse.setId(item.getId());
                    itemResponse.setProductId(item.getProduct().getId());
                    itemResponse.setProductName(item.getProduct().getName());
                    itemResponse.setProductCode(item.getProduct().getProductCode());
                    if (!item.getProduct().getVariants().isEmpty()) {
                        itemResponse.setPrice(item.getProduct().getVariants().get(0).getPrice());
                    }
                    if (!item.getProduct().getImages().isEmpty()) {
                        itemResponse.setImageUrl(item.getProduct().getImages().get(0).getImageUrl());
                    }
                    return itemResponse;
                })
                .collect(Collectors.toList()));
        return response;
    }
}
