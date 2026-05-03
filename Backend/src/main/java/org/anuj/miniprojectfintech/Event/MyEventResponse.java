package org.anuj.miniprojectfintech.Event;

public record MyEventResponse(Long eventMemberId,
                              Long eventId,
                              String eventName,
                              String clubName,
                              boolean paymentRequired,
                              boolean paymentDone) {
}
