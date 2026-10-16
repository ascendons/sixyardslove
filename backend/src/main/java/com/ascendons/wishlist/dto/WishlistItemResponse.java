package com.ascendons.wishlist.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class WishlistItemResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productCode;
    private BigDecimal price;
    private String imageUrl;
}
