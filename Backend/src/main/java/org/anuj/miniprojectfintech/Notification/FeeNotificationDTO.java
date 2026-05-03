package org.anuj.miniprojectfintech.Notification;

import java.time.LocalDate;

public record FeeNotificationDTO(
        Long id,
        String context,
        Integer semester,
        LocalDate createdAt,
        LocalDate dueDate
) {
}
