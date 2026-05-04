package org.anuj.miniprojectfintech.Event;

import java.time.LocalDateTime;

public record EventMemberResponse(Long eventMemberId,
                                  Long userId,
                                  String userName,
                                  String email,
                                  /** Null when payment status is hidden for this viewer */
                                  Boolean paymentDone,
                                  String teamName,
                                  String teamDetails,
                                  LocalDateTime registeredAt) {
}
