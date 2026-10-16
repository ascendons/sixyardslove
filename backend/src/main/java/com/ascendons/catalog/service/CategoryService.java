package com.ascendons.catalog.service;

import com.ascendons.catalog.dto.CategoryRequest;
import com.ascendons.catalog.dto.CategoryResponse;
import com.ascendons.catalog.entity.Category;
import com.ascendons.catalog.mapper.CategoryMapper;
import com.ascendons.catalog.repository.CategoryRepository;
import com.ascendons.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public List<CategoryResponse> getAllCategories() {
        List<Category> roots = categoryRepository.findByParentIdIsNull();
        return categoryMapper.toResponseList(roots);
    }

    public CategoryResponse getCategoryById(UUID id) {
        Category category = findById(id);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        // Check if category with the same name already exists
        java.util.Optional<Category> existing = categoryRepository.findByName(request.getName());
        
        Category category;
        if (existing.isPresent()) {
            category = existing.get();
        } else {
            category = categoryMapper.toEntity(request);
        }

        if (request.getParentId() != null) {
            Category parent = findById(request.getParentId());
            category.setParent(parent);
        }

        if (category.getIsActive() == null) {
            category.setIsActive(true);
        }
        
        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public java.util.List<CategoryResponse> createCategoriesBulk(java.util.List<CategoryRequest> requests) {
        return requests.stream()
                .map(this::createCategory)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        Category category = findById(id);
        categoryMapper.updateEntity(request, category);

        if (request.getParentId() != null) {
            Category parent = findById(request.getParentId());
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        Category category = findById(id);
        categoryRepository.delete(category);
    }

    private Category findById(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
    }
}
