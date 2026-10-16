package com.ascendons.catalog.mapper;

import com.ascendons.catalog.dto.ProductRequest;
import com.ascendons.catalog.dto.ProductResponse;
import com.ascendons.catalog.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = { ProductVariantMapper.class, ProductImageMapper.class })
public interface ProductMapper {
    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "productName", source = "name")
    @Mapping(target = "imageUrls", expression = "java(product.getImages() != null ? product.getImages().stream().map(com.ascendons.catalog.entity.ProductImage::getImageUrl).collect(java.util.stream.Collectors.toList()) : null)")
    ProductResponse toResponse(Product product);
    
    default String mapCategoryName(com.ascendons.catalog.entity.Category category) {
        return category != null ? category.getName() : "Uncategorized";
    }

    @Mapping(target = "name", source = "productName")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    Product toEntity(ProductRequest request);

    @Mapping(target = "name", source = "productName")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(ProductRequest request, @MappingTarget Product product);
}
