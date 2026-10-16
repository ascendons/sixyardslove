package com.ascendons.shorts.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.shorts.dto.ShortRequest;
import com.ascendons.shorts.dto.ShortResponse;
import com.ascendons.shorts.entity.Short;
import com.ascendons.shorts.repository.ShortRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShortService {

    private final ShortRepository shortRepository;

    public List<ShortResponse> getAll() {
        return shortRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<ShortResponse> getActive() {
        return shortRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ShortResponse create(ShortRequest req) {
        Short s = Short.builder()
                .fileUrl(req.fileUrl())
                .caption(req.caption())
                .socialUrl(req.socialUrl())
                .metadata(req.metadata())
                .isActive(req.isActive() != null ? req.isActive() : true)
                .displayOrder(req.displayOrder() != null ? req.displayOrder() : 0)
                .build();
        return toResponse(shortRepository.save(s));
    }

    @Transactional
    public ShortResponse update(UUID id, ShortRequest req) {
        Short s = find(id);
        s.setFileUrl(req.fileUrl());
        s.setCaption(req.caption());
        s.setSocialUrl(req.socialUrl());
        s.setMetadata(req.metadata());
        if (req.isActive() != null) s.setIsActive(req.isActive());
        if (req.displayOrder() != null) s.setDisplayOrder(req.displayOrder());
        return toResponse(shortRepository.save(s));
    }

    @Transactional
    public void delete(UUID id) {
        shortRepository.delete(find(id));
    }

    private Short find(UUID id) {
        return shortRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Short", "id", id));
    }

    private ShortResponse toResponse(Short s) {
        return new ShortResponse(
                s.getId(),
                s.getFileUrl(),
                s.getCaption(),
                s.getSocialUrl(),
                s.getMetadata(),
                s.getIsActive(),
                s.getDisplayOrder(),
                s.getUploadedAt(),
                s.getCreatedAt()
        );
    }
}
