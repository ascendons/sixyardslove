package com.ascendons.media.asset;

import com.ascendons.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MediaAssetService {

    private final MediaAssetRepository repository;
    private final MediaAssetMapper mapper;

    public List<MediaAssetResponse> getByPlacement(String placement) {
        return repository.findByPlacementOrderByDisplayOrderAsc(placement)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<MediaAssetResponse> getByType(String type) {
        return repository.findByTypeOrderByPlacementAscDisplayOrderAsc(type)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public MediaAssetResponse create(MediaAssetRequest request) {
        MediaAsset asset = mapper.toEntity(request);
        return mapper.toResponse(repository.save(asset));
    }

    @Transactional
    public MediaAssetResponse update(UUID id, MediaAssetRequest request) {
        MediaAsset asset = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MediaAsset", "id", id));
        mapper.updateEntity(request, asset);
        return mapper.toResponse(repository.save(asset));
    }

    @Transactional
    public void delete(UUID id) {
        MediaAsset asset = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MediaAsset", "id", id));
        repository.delete(asset);
    }
}
