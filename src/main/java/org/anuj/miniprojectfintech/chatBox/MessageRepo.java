package org.anuj.miniprojectfintech.chatBox;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepo extends JpaRepository<Message,Long> {
    List<Message> findByChatBoxOrderBySentAtAsc(ChatBox chatBoxId);
}
