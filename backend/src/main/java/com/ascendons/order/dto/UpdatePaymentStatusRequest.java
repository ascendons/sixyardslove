package com.ascendons.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePaymentStatusRequest {
    @NotBlank(message = "Status is required")
    private String status;

    private String providerPaymentId;
    private String providerSignature;
    private String failureReason;
}
