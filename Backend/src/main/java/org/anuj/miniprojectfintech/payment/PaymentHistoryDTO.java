package org.anuj.miniprojectfintech.payment;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentHistoryDTO(
        String transactionId,
        String feeTitle,
        Integer semester,
        BigDecimal amount,
        String paymentMode,
        LocalDate paidAt,
        Boolean isDelayed
) {
}
