package com.ascendons.seller.entity;

import com.ascendons.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sellers")
@SQLDelete(sql = "UPDATE sellers SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seller {

    
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "gstin", unique = true)
    private String gstin;

    @Column(name = "address")
    private String address;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "activity")
    private String activity;

    @Column(name = "member_count")
    private Integer memberCount;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "tagline")
    private String tagline;

    @Column(name = "organization_type")
    private String organizationType;

    @Column(name = "incorporation_date")
    private LocalDate incorporationDate;

    @Column(name = "board_members_count")
    private Integer boardMembersCount;

    @Column(name = "vision", columnDefinition = "TEXT")
    private String vision;

    @Column(name = "commitment", columnDefinition = "TEXT")
    private String commitment;

    @Column(name = "closing_statement")
    private String closingStatement;

    @ElementCollection
    @CollectionTable(name = "seller_activities", joinColumns = @JoinColumn(name = "seller_id"))
    @Column(name = "activity_item", columnDefinition = "TEXT")
    @OrderColumn(name = "sort_order")
    @Builder.Default
    private List<String> activities = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "seller_mission_points", joinColumns = @JoinColumn(name = "seller_id"))
    @Column(name = "mission_point", columnDefinition = "TEXT")
    @OrderColumn(name = "sort_order")
    @Builder.Default
    private List<String> missionPoints = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
