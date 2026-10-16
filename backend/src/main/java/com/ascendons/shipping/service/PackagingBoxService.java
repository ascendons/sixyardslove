package com.ascendons.shipping.service;

import com.ascendons.shipping.dto.PackagingBoxRequest;
import com.ascendons.shipping.dto.PackagingBoxResponse;
import com.ascendons.shipping.entity.PackagingBox;
import com.ascendons.shipping.repository.PackagingBoxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PackagingBoxService {

    private final PackagingBoxRepository repository;

    public List<PackagingBoxResponse> getAllBoxes() {
        return repository.findAll().stream()
                .sorted(Comparator.comparingDouble(PackagingBox::getVolumeCm3))
                .map(this::toResponse)
                .toList();
    }

    public List<PackagingBoxResponse> getActiveBoxes() {
        return repository.findByIsActiveTrue().stream()
                .sorted(Comparator.comparingDouble(PackagingBox::getVolumeCm3))
                .map(this::toResponse)
                .toList();
    }

    public Optional<PackagingBoxResponse> getBox(UUID id) {
        return repository.findById(id).map(this::toResponse);
    }

    @Transactional
    public PackagingBoxResponse createBox(PackagingBoxRequest request) {
        PackagingBox box = PackagingBox.builder()
                .name(request.getName())
                .lengthCm(request.getLengthCm())
                .breadthCm(request.getBreadthCm())
                .heightCm(request.getHeightCm())
                .maxWeightKg(request.getMaxWeightKg() != null ? request.getMaxWeightKg() : 30.0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponse(repository.save(box));
    }

    @Transactional
    public Optional<PackagingBoxResponse> updateBox(UUID id, PackagingBoxRequest request) {
        return repository.findById(id).map(box -> {
            box.setName(request.getName());
            box.setLengthCm(request.getLengthCm());
            box.setBreadthCm(request.getBreadthCm());
            box.setHeightCm(request.getHeightCm());
            box.setMaxWeightKg(request.getMaxWeightKg() != null ? request.getMaxWeightKg() : box.getMaxWeightKg());
            if (request.getIsActive() != null) box.setIsActive(request.getIsActive());
            return toResponse(repository.save(box));
        });
    }

    @Transactional
    public boolean deleteBox(UUID id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Selects the smallest active box that can hold all items.
     *
     * Packing model: items are stacked along one axis (height), sharing the same
     * footprint — max(L) × max(B) × sum(H × qty). Each item can be oriented in
     * any of its 6 rotations, so we search all rotation combinations and return
     * the smallest box that fits at least one valid arrangement.
     */
    public Optional<PackagingBox> selectBoxForItems(List<ItemDimensions> items, double totalWeightKg) {
        if (items.isEmpty()) return Optional.empty();

        List<PackagingBox> candidates = repository.findByIsActiveTrue().stream()
                .sorted(Comparator.comparingDouble(PackagingBox::getVolumeCm3))
                .filter(box -> totalWeightKg <= box.getMaxWeightKg())
                .toList();

        if (candidates.isEmpty()) return Optional.empty();

        return searchRotations(items, 0, 0, 0, 0, candidates);
    }

    /**
     * Recursively tries all 6 orientations per item and returns the smallest
     * box (by volume) that fits the resulting aggregate dimensions.
     */
    private Optional<PackagingBox> searchRotations(
            List<ItemDimensions> items, int idx,
            double maxLmm, double maxBmm, double sumHmm,
            List<PackagingBox> boxes) {

        if (idx == items.size()) {
            double needL = maxLmm / 10.0, needB = maxBmm / 10.0, needH = sumHmm / 10.0;
            return boxes.stream()
                    .filter(b -> needL <= b.getLengthCm()
                            && needB <= b.getBreadthCm()
                            && needH <= b.getHeightCm())
                    .findFirst();
        }

        ItemDimensions item = items.get(idx);
        double a = item.lengthMm(), b = item.breadthMm(), c = item.heightMm();
        int qty = item.quantity();

        // 6 orientations: choose which dimension becomes the stacking axis (height × qty)
        double[][] orientations = {
            {a, b, c * qty}, {a, c, b * qty},
            {b, a, c * qty}, {b, c, a * qty},
            {c, a, b * qty}, {c, b, a * qty}
        };

        Optional<PackagingBox> best = Optional.empty();
        for (double[] o : orientations) {
            Optional<PackagingBox> result = searchRotations(
                    items, idx + 1,
                    Math.max(maxLmm, o[0]),
                    Math.max(maxBmm, o[1]),
                    sumHmm + o[2],
                    boxes);
            if (result.isPresent() && (best.isEmpty()
                    || result.get().getVolumeCm3() < best.get().getVolumeCm3())) {
                best = result;
            }
        }
        return best;
    }

    public record ItemDimensions(double lengthMm, double breadthMm, double heightMm, double weightKg, int quantity) {}

    private PackagingBoxResponse toResponse(PackagingBox box) {
        return PackagingBoxResponse.builder()
                .id(box.getId())
                .name(box.getName())
                .lengthCm(box.getLengthCm())
                .breadthCm(box.getBreadthCm())
                .heightCm(box.getHeightCm())
                .maxWeightKg(box.getMaxWeightKg())
                .isActive(box.getIsActive())
                .volumeCm3(box.getVolumeCm3())
                .build();
    }
}