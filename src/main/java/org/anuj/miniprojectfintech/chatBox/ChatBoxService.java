package org.anuj.miniprojectfintech.chatBox;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
public class ChatBoxService {
    private final ChatBoxRepo chatBoxRepo;
    private final MessageRepo messageRepo;
    private static final int MAX_ACTIVE_CHATBOXES = 5;
    @Transactional
    public ChatBox createChatBox(User user, @Valid CreateChatBoxRequest request) {
        int activeCount = chatBoxRepo.countByStudentAndStatusNot(user,TicketStatus.CLOSED);
        if(activeCount>=MAX_ACTIVE_CHATBOXES){
            throw new RuntimeException("You already have"+MAX_ACTIVE_CHATBOXES+"active tickets ."+
                    "Please close an existing one before raising a new one");
        }
        ChatBox chatBox = new ChatBox();
        chatBox.setStudent(user);
        chatBox.setSubject(request.getSubject());
        chatBox.setStatus(TicketStatus.OPEN);
        chatBox.setLastMessageAt(LocalDateTime.now());
        chatBoxRepo.save(chatBox);

        Message opening  = new Message();
        opening.setChatBox(chatBox);
        opening.setSender(user);
        opening.setContext(request.getFirstMessage());
        messageRepo.save(opening);

        chatBox.setStudentLastReadMessageId(opening.getId());
        chatBoxRepo.save(chatBox);
        return chatBox;
    }
    @Transactional // check if the chatbox exist , check that the sender is either the correct student and assigned admin, check if the ticket is closed
    public Message sendMessage(User user, Long chatBoxId, @Valid SendMessageRequest request) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("Chat Box doesnt exist "));

        boolean isStudent = chatBox.getStudent().getId().equals(user.getId());
        if(!isStudent && chatBox.getAdmin() == null){
            chatBox.setAdmin(user);
            chatBox.setStatus(TicketStatus.IN_PROGRESS);
        }
        boolean isAdmin = chatBox.getAdmin() !=null && chatBox.getAdmin().getId().equals(user.getId());
        if(!isAdmin && !isStudent){
            throw new RuntimeException("You are not part of this conversation");
        }

        if(chatBox.getStatus()==TicketStatus.CLOSED){
            throw new RuntimeException("The ticket is closed");
        }
        Message message = new Message();
        message.setSender(user);
        message.setContext(request.getContext());
        message.setSentAt(LocalDateTime.now());
        message.setChatBox(chatBox);
        messageRepo.save(message);
        chatBox.setLastMessageAt(LocalDateTime.now());
        if(isStudent){
            chatBox.setStudentLastReadMessageId(message.getId());
        }
        else{
            chatBox.setAdminLastReadMessageId(message.getId());
        }
        return message;
    }

    public List<ChatBox> unsignedChatBoxes() {
        return chatBoxRepo.findByStatusAndAdminIsNull(TicketStatus.OPEN);
    }

    public List<ChatBox> getAssignedChatBoxes(User admin) {
        return chatBoxRepo.findByAdmin(admin);
    }

    public List<ChatBox> getStudentChatBoxes(User user) {
        return chatBoxRepo.findByStudent(user);
    }
    @Transactional
    public ChatBox takeTicket(User user, Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(
                ()->new RuntimeException("Chat box not found"));
        if(chatBox.getAdmin()!=null){
            throw new RuntimeException("Ticket is already taken by another admin");
        }
        chatBox.setAdmin(user);
        chatBox.setStatus(TicketStatus.IN_PROGRESS);
        chatBoxRepo.save(chatBox);
        return chatBox;
    }

    @Transactional
    public List<Message> getTicket(Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("Chat box doesnt exist"));
        return messageRepo.findByChatBoxOrderBySentAtAsc(chatBox);
    }
    @Transactional
    public ChatBox closeTicket(User user, Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("ChatBox not found"));
        if(!chatBox.getStudent().getId().equals(user.getId())){
            throw new RuntimeException("This ticket doesnt belong to you");
        }
        chatBox.setStatus(TicketStatus.CLOSED);
        return chatBoxRepo.save(chatBox);
    }
    @Transactional
    public ChatBox resolve(User user, Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("ChatBox not found"));
        if(!chatBox.getAdmin().getId().equals(user.getId())){
            throw new RuntimeException("This ticket doesnt belong to you");
        }
        chatBox.setStatus(TicketStatus.RESOLVED);
        return chatBoxRepo.save(chatBox);
    }
}
