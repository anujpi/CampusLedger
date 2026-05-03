package org.anuj.miniprojectfintech.Event;

import java.math.BigDecimal;

public record EventAcceptResponse(boolean paymentRequired,
                                  String message,
                                  Long eventMemberId,
                                  BigDecimal amount,
                                  String currency) {
}
