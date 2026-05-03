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
    @PostMapping("/accept/{clubId}")
    public ResponseEntity<?> acceptEventRequest(
            @PathVariable Long clubId,
            @RequestBody EventMemberDTO memberDTO, @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
            ){
        try {
            return ResponseEntity.ok(java.util.Map.of("message", eventAcceptService.acceptEventRequest(clubId, memberDTO, myCustomUserDetails.getUser())));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/registration")
    public ResponseEntity<?> unregisterEvent(
            @RequestParam Long eventId,
            @RequestParam Long clubId,
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
    ){
        return ResponseEntity.ok(java.util.Map.of("message", eventAcceptService.unregisterEvent(eventId,clubId,myCustomUserDetails.getUser())));
    }
    @PostMapping("/payment/success")
    public ResponseEntity<?> markPaymentSuccess(
            @RequestParam Long eventMemberId,
            @RequestParam String txnId,
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
    ){
        return ResponseEntity.ok(java.util.Map.of("message", eventAcceptService.markPaymentSuccess(eventMemberId,txnId,myCustomUserDetails.getUser())));
    }
}
