package com.ascendons.seller.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String businessName;
    private String gstin;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private String description;
    private String imageUrl;
    private String activity;
    private Integer memberCount;
    private String city;
    private String state;
    private Boolean isVerified;
    private Boolean isActive;

    private String tagline;
    private String organizationType;
    private LocalDate incorporationDate;
    private Integer boardMembersCount;
    private String vision;
    private String commitment;
    private String closingStatement;
    private List<String> activities;
    private List<String> missionPoints;
}
