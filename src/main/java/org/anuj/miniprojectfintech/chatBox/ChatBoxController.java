package org.anuj.miniprojectfintech.chatBox;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class ChatBoxController {
    private final ChatBoxService chatBoxService;

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/student/chatbox")
    public ResponseEntity<ChatBox> create(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @Valid @RequestBody CreateChatBoxRequest request
            ){
        return ResponseEntity.ok(chatBoxService.createChatBox(currentUser.getUser(),request));
    }
    @PostMapping("/chatbox/{chatBoxId}/message")
    public ResponseEntity<Message> sendMessage(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Long chatBoxId,
            @Valid @RequestBody SendMessageRequest request
    ){
        return ResponseEntity.ok(chatBoxService.sendMessage(currentUser.getUser(),chatBoxId,request));
    }
    // admin to view all tickets raised by students and then have the ability to take up a ticket
    // student to view all of his ticket history
    //admin viewing all unassigned chat boxes
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/chatbox/open")
    public ResponseEntity<List<ChatBox>> unassignedChatBox(){
        return ResponseEntity.ok(chatBoxService.unsignedChatBoxes());
    }
    // admin viewing all there assigned chat boxes
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/chatbox/mine")
    public ResponseEntity<List<ChatBox>> assignedChatBox(@AuthenticationPrincipal MyCustomUserDetails currentUser){
        return ResponseEntity.ok(chatBoxService.getAssignedChatBoxes(currentUser.getUser()));
    }
    // student viewing all of there chatbox
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/student/chatbox")
    public ResponseEntity<List<ChatBox>> studentChatBoxes(@AuthenticationPrincipal MyCustomUserDetails currentUser){
        return ResponseEntity.ok(chatBoxService.getStudentChatBoxes(currentUser.getUser()));
    }
    // admin to pick up a ticket
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/chatBox/{chatBoxId}/take")
    public ResponseEntity<ChatBox> take(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Long chatBoxId
    ){
        return ResponseEntity.ok(chatBoxService.takeTicket(currentUser.getUser(),chatBoxId));
    }
    @GetMapping("/chatbox/{chatBoxId}/ticket3")
    public ResponseEntity<List<Message>> ticket(
            @PathVariable Long chatBoxId
    ) {
        return ResponseEntity.ok(chatBoxService.getTicket(chatBoxId));
    }
    // close a chatBox(ticket)
    @PreAuthorize("hasRole('STUDENT')")
    @PatchMapping("/students/chatbox/{chatBoxId}/close")
    public ResponseEntity<ChatBox> closeTicket(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Long chatBoxId
    ){
        return ResponseEntity.ok(chatBoxService.closeTicket(currentUser.getUser(),chatBoxId));
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/chatBox/{chatBoxId}/resolve")
    public ResponseEntity<ChatBox> resolve(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Long chatBoxId
    ){
        return ResponseEntity.ok(chatBoxService.resolve(currentUser.getUser(),chatBoxId));
    }

}
