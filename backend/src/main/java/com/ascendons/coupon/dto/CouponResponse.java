package com.ascendons.coupon.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CouponResponse {
    private UUID id;
    private String code;
    private String description;
    private String discountType;
    private BigDecimal discountValue;
    private Integer buyQty;
    private Integer getQty;
    private BigDecimal minCartValue;
    private BigDecimal maxDiscount;
    private OffsetDateTime expiresAt;
    private Integer usageLimit;
    private Integer userLimit;
    private Boolean isActive;
    private String buySku;
    private String getSku;
    private java.util.List<CouponRuleResponse> rules;
    /** Set when returned from /api/coupons/all — true if this coupon applies to the requested product */
    private Boolean applicable;
}
