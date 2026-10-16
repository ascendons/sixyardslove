package com.ascendons.shipping.service;

import com.ascendons.order.entity.Order;
import com.ascendons.order.entity.OrderBoxAssignment;
import com.ascendons.order.entity.PackedItem;
import com.ascendons.order.repository.OrderBoxAssignmentRepository;
import com.ascendons.shipping.entity.PackagingBox;
import com.ascendons.shipping.repository.PackagingBoxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PackagingService {

    private final PackagingBoxRepository boxRepository;
    private final OrderBoxAssignmentRepository boxAssignmentRepository;

    private static final double PADDING_CM = 0.5; // 5mm padding

    /**
     * Pack items into boxes using First Fit Decreasing bin-packing.
     * Max 4 items per box. 5mm padding between items and walls.
     * Returns list of box assignments (one per box used), sorted by sequence.
     */
    public List<OrderBoxAssignment> packItems(Order order, List<PackagingItem> items) {
        if (items == null || items.isEmpty()) return Collections.emptyList();

        List<PackagingBox> boxes = boxRepository.findByIsActiveTrue().stream()
                .sorted(Comparator.comparingDouble(PackagingBox::getVolumeCm3))
                .toList();

        if (boxes.isEmpty()) return Collections.emptyList();

        // Sort items by volume descending (largest first)
        List<PackagingItem> sortedItems = items.stream()
                .sorted(Comparator.comparingDouble(PackagingItem::volume).reversed())
                .toList();

        List<BoxResult> boxResults = new ArrayList<>();
        List<PackagingItem> remaining = new ArrayList<>(sortedItems);
        int sequence = 1;

        while (!remaining.isEmpty()) {
            List<PackagingItem> batch = new ArrayList<>();
            for (Iterator<PackagingItem> it = remaining.iterator(); it.hasNext(); ) {
                PackagingItem item = it.next();
                if (batch.size() >= 4) break;
                if (fitsInBatch(item, batch, boxes)) {
                    batch.add(item);
                    it.remove();
                }
            }
            // If no items fit the current batch (shouldn't happen with single-item batches), force-add one
            if (batch.isEmpty() && !remaining.isEmpty()) {
                batch.add(remaining.remove(0));
            }
            BoxResult result = findBestBox(batch, boxes);
            if (result == null) {
                // No box fits this batch — skip packaging (dimensions likely not configured)
                log.warn("No packaging box found for batch of {} item(s); skipping box assignment", batch.size());
                break;
            }
            result.sequence = sequence++;
            boxResults.add(result);
        }

        // Convert to OrderBoxAssignment entities
        List<OrderBoxAssignment> assignments = new ArrayList<>();
        for (BoxResult result : boxResults) {
            OrderBoxAssignment assignment = OrderBoxAssignment.builder()
                    .order(order)
                    .boxId(result.box.getId())
                    .boxName(result.box.getName())
                    .boxLengthCm(result.box.getLengthCm())
                    .boxBreadthCm(result.box.getBreadthCm())
                    .boxHeightCm(result.box.getHeightCm())
                    .boxWeightKg(result.box.getMaxWeightKg())
                    .totalItemsWeightKg(result.totalWeightKg)
                    .sequence(result.sequence)
                    .packedItems(result.packedItems)
                    .build();
            assignments.add(assignment);
        }
        return assignments;
    }

    private boolean fitsInBatch(PackagingItem item, List<PackagingItem> batch, List<PackagingBox> boxes) {
        if (batch.isEmpty()) return true;
        // Find smallest box that fits current batch + new item
        List<PackagingItem> trial = new ArrayList<>(batch);
        trial.add(item);
        return findBestBox(trial, boxes) != null;
    }

    private BoxResult findBestBox(List<PackagingItem> items, List<PackagingBox> boxes) {
        double totalWeightKg = items.stream().mapToDouble(PackagingItem::weightKg).sum();
        for (PackagingBox box : boxes) {
            if (totalWeightKg > box.getMaxWeightKg()) continue;
            if (allItemsFitInBox(items, box)) {
                List<PackedItem> packedItems = items.stream()
                        .map(item -> PackedItem.builder()
                                .variantId(item.variantId != null ? item.variantId.toString() : null)
                                .sku(item.sku)
                                .productName(item.productName)
                                .quantity(item.quantity)
                                .itemLengthMm(item.lengthMm)
                                .itemBreadthMm(item.breadthMm)
                                .itemHeightMm(item.heightMm)
                                .itemWeightKg(item.weightKg)
                                .build())
                        .toList();
                return new BoxResult(box, packedItems, totalWeightKg, 0);
            }
        }
        return null;
    }

    private boolean allItemsFitInBox(List<PackagingItem> items, PackagingBox box) {
        // 2D bin packing approximation: check if all items can fit with 5mm padding
        // Convert box dimensions to mm for easier comparison
        double boxLengthMm = box.getLengthCm() * 10;
        double boxBreadthMm = box.getBreadthCm() * 10;
        double boxHeightMm = box.getHeightCm() * 10;

        // Check each item fits individually (with padding)
        for (PackagingItem item : items) {
            double paddedLength = item.lengthMm + PADDING_CM * 10;
            double paddedBreadth = item.breadthMm + PADDING_CM * 10;
            double paddedHeight = item.heightMm + PADDING_CM * 10;

            if (paddedLength > boxLengthMm || paddedBreadth > boxBreadthMm || paddedHeight > boxHeightMm) {
                return false;
            }
        }

        // Additional check: total items must fit within box dimensions
        // Use bounding box check for all items combined
        double totalLengthNeeded = items.stream().mapToDouble(i -> i.lengthMm + PADDING_CM * 10).sum();
        double totalBreadthNeeded = items.stream().mapToDouble(i -> i.breadthMm + PADDING_CM * 10).sum();
        double totalHeightNeeded = items.stream().mapToDouble(i -> i.heightMm + PADDING_CM * 10).max().orElse(0);

        // Simple linear check: items arranged side by side along length
        // If items fit individually, they should fit with padding
        for (PackagingItem item : items) {
            double paddedLen = item.lengthMm + PADDING_CM * 10;
            double paddedBrd = item.breadthMm + PADDING_CM * 10;
            double paddedHgt = item.heightMm + PADDING_CM * 10;

            if (paddedLen > boxLengthMm || paddedBrd > boxBreadthMm || paddedHgt > boxHeightMm) {
                return false;
            }
        }

        // Check sum of item breadths along box breadth (assuming width-wise stacking)
        double sumBreadths = items.stream().mapToDouble(i -> i.breadthMm + PADDING_CM * 10).sum();
        double maxBreadthInBatch = items.stream().mapToDouble(i -> i.breadthMm + PADDING_CM * 10).max().orElse(0);

        // Items stacked along length axis
        double sumLengths = items.stream().mapToDouble(i -> i.lengthMm + PADDING_CM * 10).sum();
        double maxLengthInBatch = items.stream().mapToDouble(i -> i.lengthMm + PADDING_CM * 10).max().orElse(0);

        // Must fit within box breadth when arranged
        boolean breadthOk = maxBreadthInBatch <= boxBreadthMm && sumLengths <= boxLengthMm;
        // Or arranged differently (swap length/breadth)
        boolean lengthOk = maxLengthInBatch <= boxBreadthMm && sumBreadths <= boxLengthMm;

        return breadthOk || lengthOk;
    }

    @Transactional
    public List<OrderBoxAssignment> saveAssignments(List<OrderBoxAssignment> assignments) {
        return assignments.stream().map(boxAssignmentRepository::save).toList();
    }

    public record PackagingItem(
            UUID variantId,
            String sku,
            String productName,
            int quantity,
            double lengthMm,
            double breadthMm,
            double heightMm,
            double weightKg
    ) {
        public double volume() { return lengthMm * breadthMm * heightMm; }
    }

    private static class BoxResult {
        PackagingBox box;
        List<PackedItem> packedItems;
        double totalWeightKg;
        int sequence;

        BoxResult(PackagingBox box, List<PackedItem> packedItems, double totalWeightKg, int sequence) {
            this.box = box;
            this.packedItems = packedItems;
            this.totalWeightKg = totalWeightKg;
            this.sequence = sequence;
        }
    }
}