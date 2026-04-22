package org.anuj.miniprojectfintech.Event;

import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/event")
@PreAuthorize("hasRole('STUDENT')")
public class EventAcceptController{
    private final EventAcceptService eventAcceptService;
    @PostMapping("/accept")
    public ResponseEntity<EventAcceptResponse> acceptEventRequest(
            @RequestBody EventMemberDTO memberDTO,@AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
            ){
        return ResponseEntity.ok(eventAcceptService.acceptEventRequest(memberDTO,myCustomUserDetails.getUser()));
    }
    @DeleteMapping("/registration")
    public ResponseEntity<String> unregisterEvent(
            @RequestParam Long eventId,
            @RequestParam Long clubId,
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
    ){
        return ResponseEntity.ok(eventAcceptService.unregisterEvent(eventId,clubId,myCustomUserDetails.getUser()));
    }
    @PostMapping("/payment/success")
    public ResponseEntity<String> markPaymentSuccess(
            @RequestParam Long eventMemberId,
            @RequestParam String txnId,
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
    ){
        return ResponseEntity.ok(eventAcceptService.markPaymentSuccess(eventMemberId,txnId,myCustomUserDetails.getUser()));
    }
}
