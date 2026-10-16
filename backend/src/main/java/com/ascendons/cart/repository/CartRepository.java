package com.ascendons.cart.repository;

import com.ascendons.cart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {
    Optional<Cart> findByUserId(UUID userId);

    // Carts that currently hold items — since OrderService clears a cart's items
    // the moment an order is placed, any cart with items still on it has never
    // been checked out, so no separate "abandoned" status is needed.
    @Query("""
            SELECT DISTINCT c FROM Cart c
            JOIN FETCH c.user
            LEFT JOIN FETCH c.items i
            LEFT JOIN FETCH i.productVariant pv
            LEFT JOIN FETCH pv.product
            WHERE c.items IS NOT EMPTY
            ORDER BY c.updatedAt DESC
            """)
    List<Cart> findAllWithItems();
}
