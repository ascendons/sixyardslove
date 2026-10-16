package com.ascendons.seller.repository;

import com.ascendons.seller.entity.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SellerRepository extends JpaRepository<Seller, UUID> {
    List<Seller> findAllByIsActiveTrue();
}
