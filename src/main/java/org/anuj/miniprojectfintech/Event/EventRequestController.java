package org.anuj.miniprojectfintech.Event;

import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
@RequiredArgsConstructor
@RequestMapping("/api/event")
public class EventRequestController {
    private final EventRequestService eventRequestService;
    @PostMapping("/request/{clubId}")
    public ResponseEntity<?> sendRequest(
            @PathVariable Long clubId,
            @RequestBody RequestDTO requestDTO, @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
            ){
        try {
            return ResponseEntity.ok(eventRequestService.sendRequest(clubId, requestDTO,myCustomUserDetails.getUser()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @DeleteMapping("/request")
    public ResponseEntity<String> deleteRequest(
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
            ,@RequestParam Long eventId,@RequestParam Long clubId
    ){
        return ResponseEntity.ok(eventRequestService.deleteRequest(myCustomUserDetails.getUser(),eventId,clubId));
    }
    @PutMapping("/request/{clubId}/{eventId}")
    public ResponseEntity<String> updateEvent(
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails,
            @PathVariable Long clubId,
            @PathVariable Long eventId,
            @RequestBody RequestDTO requestDTO
    ){
        return ResponseEntity.ok(eventRequestService.updateEvent(eventId,clubId,requestDTO,myCustomUserDetails.getUser()));
    }
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<EventSummaryResponse>> listEventsByClub(
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails,
            @PathVariable Long clubId
    ){
        return ResponseEntity.ok(eventRequestService.listEventsByClub(clubId,myCustomUserDetails.getUser()));
    }
    @GetMapping("/{clubId}/{eventId}")
    public ResponseEntity<EventDetailsResponse> getEventById(
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails,
            @PathVariable Long clubId,
            @PathVariable Long eventId
    ){
        return ResponseEntity.ok(eventRequestService.getEventById(eventId,clubId,myCustomUserDetails.getUser()));
    }
    @GetMapping("/my")
    public ResponseEntity<List<MyEventResponse>> listMyRegisteredEvents(
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails
    ){
        return ResponseEntity.ok(eventRequestService.listMyRegisteredEvents(myCustomUserDetails.getUser()));
    }
    @GetMapping("/{clubId}/{eventId}/members")
    public ResponseEntity<List<EventMemberResponse>> listEventMembers(
            @AuthenticationPrincipal MyCustomUserDetails myCustomUserDetails,
            @PathVariable Long clubId,
            @PathVariable Long eventId
    ){
        return ResponseEntity.ok(eventRequestService.listEventMembers(eventId,clubId,myCustomUserDetails.getUser()));
    }
}
