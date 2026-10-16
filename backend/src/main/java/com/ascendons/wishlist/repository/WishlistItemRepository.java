package com.ascendons.wishlist.repository;

import com.ascendons.wishlist.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, UUID> {
    Optional<WishlistItem> findByWishlistIdAndProductId(UUID wishlistId, UUID productId);
    boolean existsByWishlistUserIdAndProductId(UUID userId, UUID productId);

    /** Finds the non-deleted wishlist item via the user's wishlist. */
    @Query("SELECT wi FROM WishlistItem wi JOIN wi.wishlist w " +
           "WHERE w.user.id = :userId AND wi.product.id = :productId AND wi.deletedAt IS NULL")
    Optional<WishlistItem> findActiveByUserIdAndProductId(@Param("userId") UUID userId, @Param("productId") UUID productId);

    /** Deletes the non-deleted wishlist item via the user's wishlist (soft-delete). */
    @Modifying
    @Transactional
    @Query("UPDATE WishlistItem wi SET wi.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE wi.id = (SELECT wi2.id FROM WishlistItem wi2 JOIN wi2.wishlist w " +
           "WHERE w.user.id = :userId AND wi2.product.id = :productId AND wi2.deletedAt IS NULL)")
    void softDeleteByUserIdAndProductId(@Param("userId") UUID userId, @Param("productId") UUID productId);
}