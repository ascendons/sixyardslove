package com.ascendons.coupon.mapper;

import com.ascendons.coupon.dto.CouponResponse;
import com.ascendons.coupon.dto.CouponRuleResponse;
import com.ascendons.coupon.entity.Coupon;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CouponMapper {

    public CouponResponse toResponse(Coupon coupon) {
        if (coupon == null) return null;
        
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .buyQty(coupon.getBuyQty())
                .getQty(coupon.getGetQty())
                .minCartValue(coupon.getMinCartValue())
                .maxDiscount(coupon.getMaxDiscount())
                .expiresAt(coupon.getExpiresAt())
                .usageLimit(coupon.getUsageLimit())
                .userLimit(coupon.getUserLimit())
                .isActive(coupon.getIsActive())
                .buySku(coupon.getBuySku())
                .getSku(coupon.getGetSku())
                .rules(coupon.getRules() == null ? null : coupon.getRules().stream()
                        .map(rule -> CouponRuleResponse.builder()
                                .id(rule.getId())
                                .ruleType(rule.getRuleType().name())
                                .entityId(rule.getEntityId())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    public CouponResponse toResponse(Coupon coupon, boolean applicable) {
        CouponResponse response = toResponse(coupon);
        response.setApplicable(applicable);
        return response;
    }

    public List<CouponResponse> toResponseList(List<Coupon> coupons) {
        return coupons.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
