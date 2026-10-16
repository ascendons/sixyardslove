package com.ascendons.cart.service;

import com.ascendons.cart.dto.CartItemRequest;
import com.ascendons.cart.dto.CartItemResponse;
import com.ascendons.cart.dto.CartResponse;
import com.ascendons.cart.entity.Cart;
import com.ascendons.cart.entity.CartItem;
import com.ascendons.cart.mapper.CartItemMapper;
import com.ascendons.cart.mapper.CartMapper;
import com.ascendons.cart.repository.CartItemRepository;
import com.ascendons.cart.repository.CartRepository;
import com.ascendons.catalog.entity.ProductVariant;
import com.ascendons.catalog.repository.ProductVariantRepository;
import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.geo.context.GeoContext;
import com.ascendons.geo.entity.Currency;
import com.ascendons.geo.service.CurrencyService;
import com.ascendons.user.entity.User;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final CartMapper cartMapper;
    private final CartItemMapper cartItemMapper;
    private final GeoContext geoContext;
    private final CurrencyService currencyService;

    public CartResponse getCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        CartResponse response = cartMapper.toResponse(cart);
        List<CartItemResponse> items = cartItemMapper.toResponseList(cart.getItems());
        response.setItems(items);

        BigDecimal totalInBase = calculateTotal(cart.getItems());

        // Convert to user's currency if available
        String currencyCode = geoContext.getCurrencyCode();
        if (currencyCode != null && !currencyCode.isBlank()) {
            Currency baseCurrency = currencyService.getBaseCurrency();
            response.setTotalAmount(currencyService.convert(totalInBase, baseCurrency.getCode(), currencyCode));
            response.setCurrency(currencyCode);
        } else {
            response.setTotalAmount(totalInBase);
            Currency baseCurrency = currencyService.getBaseCurrency();
            response.setCurrency(baseCurrency.getCode());
        }

        return response;
    }

    @Transactional
    public CartResponse addItem(UUID userId, CartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        ProductVariant variant = variantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", request.getProductVariantId()));

        Optional<CartItem> existingItem = cartItemRepository
                .findByCartIdAndProductVariantId(cart.getId(), variant.getId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .productVariant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(item);
        }

        return getCart(userId);
    }

    @Transactional
    public CartResponse updateItem(UUID userId, UUID itemId, CartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("CartItem", "id", itemId);
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return getCart(userId);
    }

    @Transactional
    public CartResponse removeItem(UUID userId, UUID itemId) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("CartItem", "id", itemId);
        }

        cartItemRepository.delete(item);
        cart.getItems().remove(item);
        return getCart(userId);
    }

    @Transactional
    public void clearCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        items.forEach(cartItemRepository::delete);
    }

    private Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });
    }

    private BigDecimal calculateTotal(List<CartItem> items) {
        if (items == null) return BigDecimal.ZERO;
        return items.stream()
                .map(item -> item.getProductVariant().getEffectivePrice(item.getQuantity())
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
