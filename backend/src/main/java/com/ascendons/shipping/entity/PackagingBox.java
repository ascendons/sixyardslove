package com.ascendons.shipping.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "packaging_boxes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackagingBox {
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "length_cm", nullable = false)
    private Double lengthCm;

    @Column(name = "breadth_cm", nullable = false)
    private Double breadthCm;

    @Column(name = "height_cm", nullable = false)
    private Double heightCm;

    @Column(name = "max_weight_kg", nullable = false)
    @Builder.Default
    private Double maxWeightKg = 30.0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    @Transient
    public double getVolumeCm3() {
        return lengthCm * breadthCm * heightCm;
    }
}