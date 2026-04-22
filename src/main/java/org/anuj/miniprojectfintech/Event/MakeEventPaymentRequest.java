package org.anuj.miniprojectfintech.Event;

import org.anuj.miniprojectfintech.payment.PaymentMode;

public record MakeEventPaymentRequest(Long eventMemberId, PaymentMode paymentMode) {
}
