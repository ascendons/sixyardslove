package com.ascendons.shorts.repository;

import com.ascendons.shorts.entity.Short;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShortRepository extends JpaRepository<Short, UUID> {
    List<Short> findByIsActiveTrueOrderByDisplayOrderAsc();
}
