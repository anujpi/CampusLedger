package org.anuj.miniprojectfintech.Event;

public record EventMemberResponse(Long eventMemberId,
                                  Long userId,
                                  String userName,
                                  String email,
                                  boolean paymentDone,
                                  String teamName,
                                  String teamDetails) {
}
