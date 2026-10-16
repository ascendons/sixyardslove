package com.ascendons.catalog.service;

import com.ascendons.catalog.dto.ProductImageRequest;
import com.ascendons.catalog.dto.ProductImageResponse;
import com.ascendons.catalog.entity.Product;
import com.ascendons.catalog.entity.ProductImage;
import com.ascendons.catalog.mapper.ProductImageMapper;
import com.ascendons.catalog.repository.ProductImageRepository;
import com.ascendons.catalog.repository.ProductRepository;
import com.ascendons.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductImageRepository imageRepository;
    private final ProductRepository productRepository;
    private final ProductImageMapper imageMapper;

    public List<ProductImageResponse> getImagesByProduct(UUID productId) {
        return imageRepository.findByProductId(productId).stream()
                .map(imageMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductImageResponse addImage(ProductImageRequest request) {
        if (request.getProductId() == null) {
            throw new com.ascendons.exception.BadRequestException("Product ID is required");
        }
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        ProductImage image = imageMapper.toEntity(request);
        image.setProduct(product);
        image = imageRepository.save(image);
        return imageMapper.toResponse(image);
    }

    @Transactional
    public void deleteImage(UUID id) {
        ProductImage image = imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", "id", id));
        imageRepository.delete(image);
    }
}
