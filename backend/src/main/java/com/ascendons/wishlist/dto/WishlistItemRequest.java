package com.ascendons.wishlist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class WishlistItemRequest {
    @NotNull(message = "Product ID is required")
    private UUID productId;
}
