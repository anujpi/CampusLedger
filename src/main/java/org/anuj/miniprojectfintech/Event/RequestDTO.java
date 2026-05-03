package org.anuj.miniprojectfintech.Event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RequestDTO(String name, String description, LocalDateTime createdAt, LocalDateTime dueDate, String clubName,
                         BigDecimal amount, Boolean solo, Integer teamSize) {
}
