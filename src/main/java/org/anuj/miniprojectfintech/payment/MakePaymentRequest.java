package org.anuj.miniprojectfintech.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MakePaymentRequest {
    @NotNull
    private Long studentFeeId;
    @NotNull
    private PaymentMode paymentMode;
}
