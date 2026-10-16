package com.ascendons.feature.controller;

import com.ascendons.feature.dto.FeatureSectionResponse;
import com.ascendons.feature.service.FeatureSectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/featured/sections")
@RequiredArgsConstructor
public class FeatureSectionController {

    private final FeatureSectionService sectionService;

    @GetMapping
    public ResponseEntity<List<FeatureSectionResponse>> getActiveSections() {
        return ResponseEntity.ok(sectionService.getActiveSections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeatureSectionResponse> getSectionById(@PathVariable UUID id) {
        return ResponseEntity.ok(sectionService.getSectionById(id));
    }
}
