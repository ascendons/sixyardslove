package com.ascendons.feature.mapper;

import com.ascendons.catalog.entity.ProductImage;
import com.ascendons.feature.dto.FeaturedProductResponse;
import com.ascendons.feature.entity.FeaturedProduct;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FeaturedProductMapper {
    @Mapping(target = "featureSectionId", source = "featureSection.id")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "imageUrl", expression = "java(resolveImageUrl(fp))")
    FeaturedProductResponse toResponse(FeaturedProduct fp);

    List<FeaturedProductResponse> toResponseList(List<FeaturedProduct> list);

    default String resolveImageUrl(FeaturedProduct fp) {
        if (fp.getProduct() == null || fp.getProduct().getImages() == null || fp.getProduct().getImages().isEmpty()) {
            return null;
        }
        return fp.getProduct().getImages().stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsPrimary()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(fp.getProduct().getImages().get(0).getImageUrl());
    }
}
