package com.ascendons.catalog.entity;

import com.ascendons.inventory.entity.Inventory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_variants")
@SQLDelete(sql = "UPDATE product_variants SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    public BigDecimal getEffectivePrice(int quantity) {
        if (bulkOrderPrice != null && moq != null && quantity >= moq) {
            return bulkOrderPrice;
        }
        return price;
    }


    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Integer version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "sku", unique = true, nullable = false)
    private String sku;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "packaging")
    private String packaging;

    @Column(name = "length_mm")
    private Double lengthMm;

    @Column(name = "breadth_mm")
    private Double breadthMm;

    @Column(name = "height_mm")
    private Double heightMm;

    @Column(name = "units_per_box")
    private Integer unitsPerBox;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "mrp", precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "bulk_order_price", precision = 10, scale = 2)
    private BigDecimal bulkOrderPrice;

    @Column(name = "moq")
    private Integer moq;

    @Column(name = "cogs", precision = 10, scale = 2)
    private BigDecimal cogs;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToOne(mappedBy = "productVariant", fetch = FetchType.LAZY)
    private Inventory inventory;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null)
            id = UUID.randomUUID();
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
