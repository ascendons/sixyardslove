package com.ascendons.order.dto;

import com.ascendons.user.dto.UserAddressResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private String orderNumber;
    private String invoiceNumber;
    private UUID userId;
    private UUID addressId;
    private String status;
    private Boolean isBulk;
    private BigDecimal totalAmount;
    private String currency;
    private BigDecimal exchangeRate;
    private BigDecimal taxAmount;
    private BigDecimal taxRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal shippingFee;
    private String couponCode;
    private BigDecimal couponDiscount;
    private String customerName;
    private String paymentId;
    private String shippingId;
    private UserAddressResponse address;
    private List<OrderItemResponse> items;
    private List<PaymentResponse> payments;
    private List<OrderBoxAssignmentResponse> packagingBoxAssignments;
    private OffsetDateTime createdAt;
    private Boolean returnRequested;
    private String returnReason;
    private OffsetDateTime returnRequestedAt;
    private OffsetDateTime expiresAt;
    private String adminNotes;
    private List<ShipmentResponse> shipments;
}
