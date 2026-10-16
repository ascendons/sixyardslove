package com.ascendons.coupon.repository;

import com.ascendons.coupon.entity.CouponRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CouponRuleRepository extends JpaRepository<CouponRule, UUID> {
}
