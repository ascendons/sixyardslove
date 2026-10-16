package com.ascendons.feature.mapper;

import com.ascendons.feature.dto.FeatureSectionRequest;
import com.ascendons.feature.dto.FeatureSectionResponse;
import com.ascendons.feature.entity.FeatureSection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {FeaturedProductMapper.class})
public interface FeatureSectionMapper {
    FeatureSectionResponse toResponse(FeatureSection section);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "featuredProducts", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    FeatureSection toEntity(FeatureSectionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "featuredProducts", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(FeatureSectionRequest request, @MappingTarget FeatureSection section);
}
