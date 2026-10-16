package com.ascendons.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "order_box_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderBoxAssignment {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "box_id")
    private UUID boxId;

    @Column(name = "box_name", nullable = false)
    private String boxName;

    @Column(name = "box_length_cm", nullable = false)
    private Double boxLengthCm;

    @Column(name = "box_breadth_cm", nullable = false)
    private Double boxBreadthCm;

    @Column(name = "box_height_cm", nullable = false)
    private Double boxHeightCm;

    @Column(name = "box_weight_kg")
    private Double boxWeightKg;

    @Column(name = "total_items_weight_kg")
    private Double totalItemsWeightKg;

    @Column(name = "sequence")
    private Integer sequence;

    @ElementCollection
    @CollectionTable(name = "order_box_packed_items", joinColumns = @JoinColumn(name = "order_box_assignment_id"))
    private List<PackedItem> packedItems = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = OffsetDateTime.now();
    }
}