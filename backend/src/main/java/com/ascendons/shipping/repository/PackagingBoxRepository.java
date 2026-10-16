package com.ascendons.shipping.repository;

import com.ascendons.shipping.entity.PackagingBox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PackagingBoxRepository extends JpaRepository<PackagingBox, UUID> {
    List<PackagingBox> findByIsActiveTrue();
}