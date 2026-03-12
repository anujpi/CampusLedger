package org.anuj.miniprojectfintech.payment;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
@Getter
@AllArgsConstructor
public class PaymentReceipt {

    private String transactionId;
    private String studentName;
    private String feeTitle;
    private Integer semester;
    private BigDecimal amount;
    private PaymentMode paymentMode;
    private PaymentStatus paymentStatus;
    private boolean wasDelayed;
    private LocalDate paidAt;
}
