package com.ascendons.coupon.service;

import com.ascendons.coupon.dto.CartItemDTO;
import com.ascendons.coupon.dto.CouponValidationResponse;
import com.ascendons.coupon.entity.*;
import com.ascendons.coupon.repository.CouponRepository;
import com.ascendons.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final com.ascendons.catalog.repository.ProductVariantRepository productVariantRepository;

    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, UUID userId, List<CartItemDTO> cartItems) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElse(null);

        if (coupon == null) {
            return CouponValidationResponse.builder().valid(false).message("Invalid coupon code").build();
        }

        if (!Boolean.TRUE.equals(coupon.getIsActive())) {
            return CouponValidationResponse.builder().valid(false).message("Coupon is inactive").build();
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (coupon.getStartAt().isAfter(now)) {
            return CouponValidationResponse.builder().valid(false).message("Coupon is not yet valid").build();
        }

        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(now)) {
            return CouponValidationResponse.builder().valid(false).message("Coupon has expired").build();
        }

        if (coupon.getUser() != null && !coupon.getUser().getId().equals(userId)) {
            return CouponValidationResponse.builder().valid(false).message("This coupon is not for you").build();
        }

        // Global limit — 0 or null both mean "no limit"
        if (coupon.getUsageLimit() != null && coupon.getUsageLimit() > 0) {
            long totalUsage = orderRepository.countByCouponCode(code);
            if (totalUsage >= coupon.getUsageLimit()) {
                return CouponValidationResponse.builder().valid(false).message("Coupon usage limit reached").build();
            }
        }

        // Per user limit
        if (userId != null && coupon.getUserLimit() != null) {
            long userUsage = orderRepository.countByUserIdAndCouponCode(userId, code);
            if (userUsage >= coupon.getUserLimit()) {
                return CouponValidationResponse.builder().valid(false).message("You have already used this coupon").build();
            }
        }

        BigDecimal cartTotal = cartItems.stream()
                .map(item -> item.getPrice().multiply(new BigDecimal(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (coupon.getMinCartValue() != null && cartTotal.compareTo(coupon.getMinCartValue()) < 0) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Minimum cart value of ₹" + coupon.getMinCartValue() + " required")
                    .build();
        }

        // Rule filtering
        List<CartItemDTO> applicableItems = cartItems;
        if (coupon.getDiscountType() != DiscountType.SKU_BOGO && coupon.getRules() != null && !coupon.getRules().isEmpty()) {
            applicableItems = cartItems.stream().filter(item -> {
                for (CouponRule rule : coupon.getRules()) {
                    if (rule.getRuleType() == RuleType.ALL) return true;
                    if (rule.getRuleType() == RuleType.PRODUCT && item.getProductId() != null && rule.getEntityId().equals(item.getProductId().toString())) return true;
                    if (rule.getRuleType() == RuleType.CATEGORY && item.getCategoryId() != null && rule.getEntityId().equals(item.getCategoryId().toString())) return true;
                    if (rule.getRuleType() == RuleType.SKU) {
                        if (item.getVariantId() != null && rule.getEntityId().equals(item.getVariantId().toString())) return true;
                        if (item.getSku() != null && rule.getEntityId().equals(item.getSku())) return true;
                    }
                }
                return false;
            }).collect(Collectors.toList());
        }

        if (applicableItems.isEmpty()) {
            return CouponValidationResponse.builder().valid(false).message("Coupon not applicable to items in cart").build();
        }

        BigDecimal discountAmount = calculateDiscount(coupon, applicableItems);

        // 0 or null both mean "no cap"
        if (coupon.getMaxDiscount() != null
                && coupon.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0
                && discountAmount.compareTo(coupon.getMaxDiscount()) > 0) {
            discountAmount = coupon.getMaxDiscount();
        }

        return CouponValidationResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .message("Coupon applied successfully")
                .discountAmount(discountAmount)
                .discountType(coupon.getDiscountType().name())
                .build();
    }

    @Transactional(readOnly = true)
    public List<Coupon> getApplicableCouponsForProduct(UUID productId, UUID categoryId) {
        return getPublicActiveCoupons().stream()
                .filter(c -> isCouponApplicableToProduct(c, productId, categoryId,
                        getProductSkus(productId), getProductVariantIds(productId)))
                .collect(Collectors.toList());
    }

    /**
     * Returns ALL public active coupons, each annotated with whether it applies to the given product.
     * Used by the product page to show every coupon, with applicable ones enabled.
     */
    @Transactional(readOnly = true)
    public List<java.util.AbstractMap.SimpleEntry<Coupon, Boolean>> getAllCouponsWithApplicability(
            UUID productId, UUID categoryId) {
        List<String> skus = getProductSkus(productId);
        List<String> variantIds = getProductVariantIds(productId);

        return getPublicActiveCoupons().stream()
                .map(c -> new java.util.AbstractMap.SimpleEntry<>(c,
                        isCouponApplicableToProduct(c, productId, categoryId, skus, variantIds)))
                .collect(Collectors.toList());
    }

    private List<Coupon> getPublicActiveCoupons() {
        OffsetDateTime now = OffsetDateTime.now();
        return couponRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .filter(c -> c.getStartAt() == null || c.getStartAt().isBefore(now))
                .filter(c -> c.getExpiresAt() == null || c.getExpiresAt().isAfter(now))
                .filter(c -> c.getUsageLimit() == null || orderRepository.countByCouponCode(c.getCode()) < c.getUsageLimit())
                .filter(c -> c.getUser() == null)
                .collect(Collectors.toList());
    }

    private List<String> getProductSkus(UUID productId) {
        return productVariantRepository.findByProductId(productId).stream()
                .map(v -> v.getSku()).collect(Collectors.toList());
    }

    private List<String> getProductVariantIds(UUID productId) {
        return productVariantRepository.findByProductId(productId).stream()
                .map(v -> v.getId().toString()).collect(Collectors.toList());
    }

    private boolean isCouponApplicableToProduct(Coupon c, UUID productId, UUID categoryId,
                                                 List<String> productSkus, List<String> productVariantIds) {
        if (c.getDiscountType() == DiscountType.SKU_BOGO || c.getDiscountType() == DiscountType.BOGO) {
            return c.getBuySku() != null && productSkus.contains(c.getBuySku());
        }
        if (c.getRules() == null || c.getRules().isEmpty()) return true;
        for (CouponRule rule : c.getRules()) {
            if (rule.getRuleType() == RuleType.ALL) return true;
            if (rule.getRuleType() == RuleType.PRODUCT && rule.getEntityId().equals(productId.toString())) return true;
            if (categoryId != null && rule.getRuleType() == RuleType.CATEGORY && rule.getEntityId().equals(categoryId.toString())) return true;
            if (rule.getRuleType() == RuleType.SKU &&
                    (productSkus.contains(rule.getEntityId()) || productVariantIds.contains(rule.getEntityId()))) return true;
        }
        return false;
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Coupon getCouponByCode(String code) {
        return couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
    }

    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        if (couponRepository.findByCodeIgnoreCase(coupon.getCode()).isPresent()) {
            throw new IllegalArgumentException("Coupon code already exists");
        }
        
        if (coupon.getRules() != null) {
            for (CouponRule rule : coupon.getRules()) {
                rule.setCoupon(coupon);
            }
        }
        
        return couponRepository.save(coupon);
    }

    @Transactional
    public Coupon updateCoupon(UUID id, Coupon couponDetails) {
        Coupon existing = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));

        String newCode = couponDetails.getCode();
        if (!newCode.equalsIgnoreCase(existing.getCode())) {
            couponRepository.findByCodeIgnoreCase(newCode)
                    .filter(c -> !c.getId().equals(id))
                    .ifPresent(__ -> { throw new IllegalArgumentException("Coupon code already exists"); });
        }
        existing.setCode(newCode);
        existing.setDescription(couponDetails.getDescription());
        existing.setDiscountType(couponDetails.getDiscountType());
        existing.setDiscountValue(couponDetails.getDiscountValue());
        existing.setBuyQty(couponDetails.getBuyQty());
        existing.setGetQty(couponDetails.getGetQty());
        existing.setBuySku(couponDetails.getBuySku());
        existing.setGetSku(couponDetails.getGetSku());
        existing.setMinCartValue(couponDetails.getMinCartValue());
        existing.setMaxDiscount(couponDetails.getMaxDiscount());
        existing.setUsageLimit(couponDetails.getUsageLimit());
        existing.setUserLimit(couponDetails.getUserLimit()); // Corrected from UserUsageLimit
        existing.setExpiresAt(couponDetails.getExpiresAt());
        existing.setIsActive(couponDetails.getIsActive());
        existing.setUser(couponDetails.getUser()); // Corrected from UserId
        
        // Update rules
        if (couponDetails.getRules() != null) {
            existing.getRules().clear();
            for (CouponRule rule : couponDetails.getRules()) {
                rule.setCoupon(existing);
                existing.getRules().add(rule);
            }
        }

        return couponRepository.save(existing);
    }

    @Transactional
    public void deleteCoupon(UUID id) {
        couponRepository.deleteById(id);
    }

    private BigDecimal calculateDiscount(Coupon coupon, List<CartItemDTO> items) {
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal applicableTotal = items.stream()
                .map(item -> item.getPrice().multiply(new BigDecimal(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        switch (coupon.getDiscountType()) {
            case FIXED:
                discount = coupon.getDiscountValue();
                break;
            case PERCENT:
            case PERCENT_CAP:
                discount = applicableTotal.multiply(coupon.getDiscountValue().divide(new BigDecimal(100), 4, RoundingMode.HALF_UP));
                break;
            case BOGO: {
                CartItemDTO bogoBuyItem = items.stream()
                        .filter(item -> coupon.getBuySku() != null && coupon.getBuySku().equals(item.getSku()))
                        .findFirst().orElse(null);
                String bogoGetSku = (coupon.getGetSku() != null && !coupon.getGetSku().isBlank())
                        ? coupon.getGetSku() : coupon.getBuySku();
                CartItemDTO bogoGetItem = items.stream()
                        .filter(item -> bogoGetSku != null && bogoGetSku.equals(item.getSku()))
                        .findFirst().orElse(null);
                if (bogoBuyItem != null && bogoGetItem != null) {
                    int buyRule = coupon.getBuyQty() != null ? coupon.getBuyQty() : 1;
                    int getRule = coupon.getGetQty() != null ? coupon.getGetQty() : 1;
                    if (coupon.getBuySku().equals(bogoGetSku)) {
                        int freeUnits = (bogoBuyItem.getQuantity() / (buyRule + getRule)) * getRule;
                        discount = bogoBuyItem.getPrice().multiply(BigDecimal.valueOf(freeUnits));
                    } else if (bogoBuyItem.getQuantity() >= buyRule) {
                        int sets = bogoBuyItem.getQuantity() / buyRule;
                        int freeUnits = Math.min(bogoGetItem.getQuantity(), sets * getRule);
                        discount = bogoGetItem.getPrice().multiply(BigDecimal.valueOf(freeUnits));
                    }
                }
                break;
            }
            case SKU_BOGO:
                CartItemDTO buyItem = items.stream()
                        .filter(item -> coupon.getBuySku() != null && coupon.getBuySku().equals(item.getSku()))
                        .findFirst()
                        .orElse(null);
                CartItemDTO getItem = items.stream()
                        .filter(item -> coupon.getGetSku() != null && coupon.getGetSku().equals(item.getSku()))
                        .findFirst()
                        .orElse(null);
                if (buyItem != null && getItem != null) {
                    int buyRule = coupon.getBuyQty() != null ? coupon.getBuyQty() : 1;
                    int getRule = coupon.getGetQty() != null ? coupon.getGetQty() : 1;
                    
                    if (coupon.getBuySku().equals(coupon.getGetSku())) {
                        // Same SKU - logic like regular BOGO
                        int totalBuyQty = buyItem.getQuantity();
                        int freeUnits = (totalBuyQty / (buyRule + getRule)) * getRule;
                        discount = buyItem.getPrice().multiply(BigDecimal.valueOf(freeUnits));
                    } else if (buyItem.getQuantity() >= buyRule) {
                        // Different SKUs
                        int sets = buyItem.getQuantity() / buyRule;
                        int freeUnits = Math.min(getItem.getQuantity(), sets * getRule);
                        discount = getItem.getPrice().multiply(BigDecimal.valueOf(freeUnits));
                    }
                }
                break;
        }
        return discount.setScale(2, RoundingMode.HALF_UP);
    }
}
