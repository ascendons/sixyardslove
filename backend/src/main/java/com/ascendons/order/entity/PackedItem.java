package com.ascendons.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackedItem {

    @Column(name = "variant_id")
    private String variantId;

    @Column(name = "sku")
    private String sku;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "item_length_mm")
    private Double itemLengthMm;

    @Column(name = "item_breadth_mm")
    private Double itemBreadthMm;

    @Column(name = "item_height_mm")
    private Double itemHeightMm;

    @Column(name = "item_weight_kg")
    private Double itemWeightKg;
}