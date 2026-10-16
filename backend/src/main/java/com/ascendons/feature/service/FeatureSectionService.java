package com.ascendons.feature.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.feature.dto.FeatureSectionRequest;
import com.ascendons.feature.dto.FeatureSectionResponse;
import com.ascendons.feature.entity.FeatureSection;
import com.ascendons.feature.mapper.FeatureSectionMapper;
import com.ascendons.feature.repository.FeatureSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeatureSectionService {

    private final FeatureSectionRepository sectionRepository;
    private final FeatureSectionMapper sectionMapper;

    public List<FeatureSectionResponse> getAllSections() {
        return sectionRepository.findAll().stream()
                .map(sectionMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<FeatureSectionResponse> getActiveSections() {
        return sectionRepository.findByIsActiveTrue().stream()
                .map(sectionMapper::toResponse)
                .collect(Collectors.toList());
    }

    public FeatureSectionResponse getSectionById(UUID id) {
        FeatureSection section = findById(id);
        return sectionMapper.toResponse(section);
    }

    @Transactional
    public FeatureSectionResponse createSection(FeatureSectionRequest request) {
        FeatureSection section = sectionMapper.toEntity(request);
        section = sectionRepository.save(section);
        return sectionMapper.toResponse(section);
    }

    @Transactional
    public FeatureSectionResponse updateSection(UUID id, FeatureSectionRequest request) {
        FeatureSection section = findById(id);
        sectionMapper.updateEntity(request, section);
        section = sectionRepository.save(section);
        return sectionMapper.toResponse(section);
    }

    @Transactional
    public void deleteSection(UUID id) {
        FeatureSection section = findById(id);
        sectionRepository.delete(section);
    }

    private FeatureSection findById(UUID id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeatureSection", "id", id));
    }
}
