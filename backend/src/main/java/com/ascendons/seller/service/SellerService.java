package com.ascendons.seller.service;

import com.ascendons.exception.ResourceNotFoundException;
import com.ascendons.seller.dto.SellerRequest;
import com.ascendons.seller.dto.SellerResponse;
import com.ascendons.seller.entity.Seller;
import com.ascendons.seller.mapper.SellerMapper;
import com.ascendons.seller.repository.SellerRepository;
import com.ascendons.user.entity.Role;
import com.ascendons.user.entity.User;
import com.ascendons.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final SellerMapper sellerMapper;

    @Transactional(readOnly = true)
    public List<SellerResponse> getAllSellers() {
        return sellerRepository.findAll().stream()
                .filter(seller -> seller.getUser() != null)
                .map(sellerMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SellerResponse> getActiveSellers() {
        return sellerRepository.findAllByIsActiveTrue().stream()
                .filter(seller -> seller.getUser() != null)
                .map(sellerMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SellerResponse getSellerById(UUID id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", id));
        if (seller.getUser() == null) {
            throw new ResourceNotFoundException("Seller", "id", id);
        }
        return sellerMapper.toResponse(seller);
    }

    @Transactional(readOnly = true)
    public SellerResponse getPublicSellerById(UUID id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", id));
        if (seller.getUser() == null || !Boolean.TRUE.equals(seller.getIsActive())) {
            throw new ResourceNotFoundException("Seller", "id", id);
        }
        return sellerMapper.toResponse(seller);
    }

    @Transactional
    public SellerResponse createSeller(SellerRequest request) {
        // Create a new User for the seller
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .role(Role.SELLER)
                .isActive(true)
                .build();
        
        user = userRepository.save(user);

        Seller seller = Seller.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .gstin(StringUtils.hasText(request.getGstin()) ? request.getGstin() : null)
                .address(request.getAddress())
                .contactEmail(StringUtils.hasText(request.getContactEmail()) ? request.getContactEmail() : null)
                .contactPhone(request.getContactPhone())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .activity(request.getActivity())
                .memberCount(request.getMemberCount())
                .city(request.getCity())
                .state(request.getState())
                .isVerified(request.getIsVerified() != null ? request.getIsVerified() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .tagline(request.getTagline())
                .organizationType(request.getOrganizationType())
                .incorporationDate(request.getIncorporationDate())
                .boardMembersCount(request.getBoardMembersCount())
                .vision(request.getVision())
                .commitment(request.getCommitment())
                .closingStatement(request.getClosingStatement())
                .activities(request.getActivities() != null ? request.getActivities() : new java.util.ArrayList<>())
                .missionPoints(request.getMissionPoints() != null ? request.getMissionPoints() : new java.util.ArrayList<>())
                .build();

        seller = sellerRepository.save(seller);
        return sellerMapper.toResponse(seller);
    }

    @Transactional
    public SellerResponse updateSeller(UUID id, SellerRequest request) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", id));

        seller.setBusinessName(request.getBusinessName());
        seller.setGstin(StringUtils.hasText(request.getGstin()) ? request.getGstin() : null);
        seller.setAddress(request.getAddress());
        seller.setContactEmail(StringUtils.hasText(request.getContactEmail()) ? request.getContactEmail() : null);
        seller.setContactPhone(request.getContactPhone());
        seller.setDescription(request.getDescription());
        seller.setImageUrl(request.getImageUrl());
        seller.setActivity(request.getActivity());
        seller.setMemberCount(request.getMemberCount());
        seller.setCity(request.getCity());
        seller.setState(request.getState());
        if (request.getIsVerified() != null) {
            seller.setIsVerified(request.getIsVerified());
        }
        if (request.getIsActive() != null) {
            seller.setIsActive(request.getIsActive());
        }
        seller.setTagline(request.getTagline());
        seller.setOrganizationType(request.getOrganizationType());
        seller.setIncorporationDate(request.getIncorporationDate());
        seller.setBoardMembersCount(request.getBoardMembersCount());
        seller.setVision(request.getVision());
        seller.setCommitment(request.getCommitment());
        seller.setClosingStatement(request.getClosingStatement());

        seller.getActivities().clear();
        if (request.getActivities() != null) {
            seller.getActivities().addAll(request.getActivities());
        }
        seller.getMissionPoints().clear();
        if (request.getMissionPoints() != null) {
            seller.getMissionPoints().addAll(request.getMissionPoints());
        }

        // Update User info if present
        User user = seller.getUser();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        userRepository.save(user);

        seller = sellerRepository.save(seller);
        return sellerMapper.toResponse(seller);
    }

    @Transactional
    public void deleteSeller(UUID id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", id));
        sellerRepository.delete(seller);
    }
}
