package org.anuj.miniprojectfintech.Event;

import java.time.LocalDateTime;

public record MyEventResponse(Long eventMemberId,
                              Long eventId,
                              String eventName,
                              String clubName,
                              Long clubId,
                              String description,
                              LocalDateTime dueAt,
                              String venue,
                              boolean paymentRequired,
                              boolean paymentDone) {
}
