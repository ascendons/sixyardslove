package com.ascendons.cart.controller;

import com.ascendons.cart.entity.Cart;
import com.ascendons.cart.entity.CartItem;
import com.ascendons.cart.repository.CartRepository;
import com.ascendons.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Reporting endpoint for carts that currently hold items but were never checked out.
 * A cart's items are cleared the instant an order is placed (see OrderService.placeOrder),
 * so any cart still holding items is guaranteed to represent an incomplete checkout —
 * there's no separate "abandoned" status to track.
 */
@RestController
@RequestMapping("/admin/carts")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminCartController {

    private final CartRepository cartRepository;

    @GetMapping("/abandoned")
    public List<Map<String, Object>> getAbandonedCarts() {
        return cartRepository.findAllWithItems().stream()
                .map(this::toSummary)
                .toList();
    }

    private Map<String, Object> toSummary(Cart cart) {
        User user = cart.getUser();

        int itemCount = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        BigDecimal cartValue = cart.getItems().stream()
                .map(item -> item.getProductVariant()
                        .getEffectivePrice(item.getQuantity())
                        .multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String customerName = user == null ? null : String.join(" ",
                Objects.toString(user.getFirstName(), ""),
                Objects.toString(user.getLastName(), "")).trim();

        List<Map<String, Object>> items = cart.getItems().stream()
                .map(item -> {
                    Map<String, Object> line = new LinkedHashMap<>();
                    line.put("productName", item.getProductVariant().getProduct() != null
                            ? item.getProductVariant().getProduct().getName()
                            : null);
                    line.put("sku", item.getProductVariant().getSku());
                    line.put("quantity", item.getQuantity());
                    line.put("price", item.getProductVariant().getEffectivePrice(item.getQuantity()));
                    return line;
                })
                .toList();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("cartId", cart.getId());
        summary.put("userId", user != null ? user.getId() : null);
        summary.put("customerName", customerName == null || customerName.isBlank() ? null : customerName);
        summary.put("email", user != null ? user.getEmail() : null);
        summary.put("phone", user != null ? user.getPhone() : null);
        summary.put("distinctProducts", cart.getItems().size());
        summary.put("itemCount", itemCount);
        summary.put("cartValue", cartValue);
        summary.put("items", items);
        summary.put("createdAt", cart.getCreatedAt());
        summary.put("updatedAt", cart.getUpdatedAt());
        return summary;
    }
}
