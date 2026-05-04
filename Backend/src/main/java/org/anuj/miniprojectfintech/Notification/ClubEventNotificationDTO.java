package org.anuj.miniprojectfintech.Notification;

import java.time.LocalDateTime;

/**
 * Pushed to each member's {@code /user/queue/club-notifications} when a club publishes a new event.
 */
public record ClubEventNotificationDTO(
        String type,
        Long clubId,
        String clubName,
        Long eventId,
        String eventName,
        String venue,
        LocalDateTime dueAt
) {
}
