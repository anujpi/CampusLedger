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

    private ChatBoxDTO toDTO(ChatBox chatBox){
        return new ChatBoxDTO(
                chatBox.getId(),
                chatBox.getSubject(),
                chatBox.getStatus().name(),
                chatBox.getStudent().getFullName(),
                chatBox.getAdmin() != null? chatBox.getAdmin().getFullName() : null,
                chatBox.getLastMessageAt(),
                chatBox.getCreatedAt()
        );
    }
    private MessageDTO toMessageDTO(Message message){
        return new MessageDTO(
                message.getId(),
                message.getSender().getFullName(),
                message.getSender().getRole().name(),
                message.getContext(),
                message.getSentAt()
        );
    }
    @Transactional
    public ChatBoxDTO createChatBox(User user, @Valid CreateChatBoxRequest request) {
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
        return toDTO(chatBox);
    }
    @Transactional // check if the chatbox exist , check that the sender is either the correct student and assigned admin, check if the ticket is closed
    public MessageDTO sendMessage(User user, Long chatBoxId, @Valid SendMessageRequest request) {
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
        return toMessageDTO(message);
    }

    public List<ChatBoxDTO> unsignedChatBoxes() {
        return chatBoxRepo.findByStatusAndAdminIsNull(TicketStatus.OPEN).stream().map(this::toDTO).toList();
    }

    public List<ChatBoxDTO> getAssignedChatBoxes(User admin) {
        return chatBoxRepo.findByAdmin(admin).stream().map(this::toDTO).toList();
    }

    public List<ChatBoxDTO> getStudentChatBoxes(User user) {
        return chatBoxRepo.findByStudent(user).stream().map(this::toDTO).toList();
    }
    @Transactional
    public ChatBoxDTO takeTicket(User user, Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(
                ()->new RuntimeException("Chat box not found"));
        if(chatBox.getAdmin()!=null){
            throw new RuntimeException("Ticket is already taken by another admin");
        }
        chatBox.setAdmin(user);
        chatBox.setStatus(TicketStatus.IN_PROGRESS);
        chatBoxRepo.save(chatBox);
        return toDTO(chatBox);
    }

    @Transactional
    public List<MessageDTO> getTicket(Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("Chat box doesnt exist"));
        return messageRepo.findByChatBoxOrderBySentAtAsc(chatBox).stream().map(this::toMessageDTO).toList();
    }
    @Transactional
    public ChatBoxDTO closeTicket(User user, Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("ChatBox not found"));
        if(!chatBox.getStudent().getId().equals(user.getId())){
            throw new RuntimeException("This ticket doesnt belong to you");
        }
        chatBox.setStatus(TicketStatus.CLOSED);
        chatBoxRepo.save(chatBox);
        return toDTO(chatBox);
    }
    @Transactional
    public ChatBoxDTO resolve(User user, Long chatBoxId) {
        ChatBox chatBox = chatBoxRepo.findById(chatBoxId).orElseThrow(()->new RuntimeException("ChatBox not found"));
        if(!chatBox.getAdmin().getId().equals(user.getId())){
            throw new RuntimeException("This ticket doesnt belong to you");
        }
        chatBox.setStatus(TicketStatus.RESOLVED);
        chatBoxRepo.save(chatBox);
        return toDTO(chatBox);
    }
}
