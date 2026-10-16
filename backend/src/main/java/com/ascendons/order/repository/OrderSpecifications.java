package com.ascendons.order.repository;

import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderStatus;
import com.ascendons.user.entity.User;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;

public class OrderSpecifications {

    public static Specification<Order> withStatus(OrderStatus status) {
        return (root, query, cb) ->
                status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Order> createdAfter(OffsetDateTime from) {
        return (root, query, cb) ->
                from == null ? cb.conjunction()
                             : cb.greaterThanOrEqualTo(root.<OffsetDateTime>get("createdAt"), from);
    }

    public static Specification<Order> withUserId(java.util.UUID userId) {
        return (root, query, cb) ->
                userId == null ? cb.conjunction() : cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Order> matchSearch(String raw) {
        return (root, query, cb) -> {
            if (raw == null || raw.isBlank()) return cb.conjunction();
            String pattern = "%" + raw.toLowerCase() + "%";
            // Many-to-one join — no duplicate rows, no distinct needed
            Join<Order, User> u = root.join("user", JoinType.LEFT);
            Expression<String> idStr   = root.get("id").as(String.class);
            Expression<String> fullName = cb.concat(
                    cb.concat(cb.coalesce(u.<String>get("firstName"), ""), " "),
                    cb.coalesce(u.<String>get("lastName"), "")
            );
            return cb.or(
                    cb.like(cb.lower(idStr), pattern),
                    cb.like(cb.lower(fullName), pattern)
            );
        };
    }
}
