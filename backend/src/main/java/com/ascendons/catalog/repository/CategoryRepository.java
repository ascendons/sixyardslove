package com.ascendons.catalog.repository;

import com.ascendons.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByParentIdIsNull();
    List<Category> findByParentId(UUID parentId);
    List<Category> findByIsActiveTrue();
    java.util.Optional<Category> findByName(String name);
}
