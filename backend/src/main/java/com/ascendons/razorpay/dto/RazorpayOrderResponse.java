package com.ascendons.razorpay.dto;

import lombok.*;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RazorpayOrderResponse {
    private String keyId;
    private String razorpayOrderId;
    private long amountInPaisa;
    private String currency;
    private UUID internalOrderId;
    private UUID internalPaymentId;
    private String customerName;
    private String customerEmail;
}
