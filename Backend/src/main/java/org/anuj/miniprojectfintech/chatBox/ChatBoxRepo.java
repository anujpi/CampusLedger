package org.anuj.miniprojectfintech.chatBox;

import org.anuj.miniprojectfintech.User.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatBoxRepo extends JpaRepository<ChatBox,Long> {

    int countByStudentAndStatusNot(User user, TicketStatus ticketStatus);

    List<ChatBox> findByStatusAndAdminIsNull(TicketStatus ticketStatus);

    List<ChatBox> findByAdmin(User admin);

    List<ChatBox> findByStudent(User user);
}
