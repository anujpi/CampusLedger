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
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "chat_box_id")
    private ChatBox chatBox;
    @ManyToOne
    private User sender;

    private String context;

    private LocalDateTime sentAt = LocalDateTime.now();
}
