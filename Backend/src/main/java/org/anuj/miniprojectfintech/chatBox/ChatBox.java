package org.anuj.miniprojectfintech.chatBox;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.anuj.miniprojectfintech.User.User;

import java.time.LocalDateTime;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ChatBox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;
    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User admin;
    @Column(nullable = false)
    private String subject;
    @Enumerated(EnumType.STRING)
    private TicketStatus status;

    private Long studentLastReadMessageId;

    private Long adminLastReadMessageId;

    private LocalDateTime lastMessageAt;

    private LocalDateTime createdAt = LocalDateTime.now();

}
