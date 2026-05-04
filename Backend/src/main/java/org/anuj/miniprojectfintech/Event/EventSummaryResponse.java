package org.anuj.miniprojectfintech.Event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventSummaryResponse(Long id,
                                   String name,
                                   String description,
                                   LocalDateTime dueAt,
                                   boolean paid,
                                   BigDecimal amount,
                                   Boolean solo,
                                   Integer teamSize,
                                   String venue,
                                   boolean isJoined,
                                   /** Non-null only for club leaders/co-leaders */
                                   BigDecimal totalRevenue) {
}
