package org.anuj.miniprojectfintech.Event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventDetailsResponse(Long id,
                                   String name,
                                   String description,
                                   LocalDateTime createdAt,
                                   LocalDateTime dueAt,
                                   LocalDateTime lastRegisterAt,
                                   boolean paid,
                                   BigDecimal amount,
                                   String clubName,
                                   Boolean solo,
                                   Integer teamSize,
                                   String venue,
                                   boolean isJoined,
                                   BigDecimal revenueCollected,
                                   Integer paidRegistrations,
                                   Integer pendingRegistrations) {
}
