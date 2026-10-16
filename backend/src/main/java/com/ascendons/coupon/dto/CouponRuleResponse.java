package com.ascendons.coupon.dto;

import lombok.*;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CouponRuleResponse {
    private UUID id;
    private String ruleType;
    private String entityId;
}
