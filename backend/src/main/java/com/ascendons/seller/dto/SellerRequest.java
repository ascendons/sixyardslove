package com.ascendons.seller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRequest {
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Business name is required")
    private String businessName;
    
    private String gstin;
    private String address;
    
    @Email(message = "Invalid contact email")
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
