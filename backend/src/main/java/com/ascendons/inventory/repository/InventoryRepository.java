package com.ascendons.inventory.repository;

import com.ascendons.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, UUID> {

    @Query(value = "SELECT i FROM Inventory i JOIN FETCH i.productVariant pv JOIN FETCH pv.product p",
           countQuery = "SELECT COUNT(i) FROM Inventory i JOIN i.productVariant pv JOIN pv.product p")
    Page<Inventory> findAllWithDetails(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productVariantId = :id")
    Optional<Inventory> findByIdForUpdate(UUID id);
}
