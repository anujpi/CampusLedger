package org.anuj.miniprojectfintech.chatBox;

import java.time.LocalDateTime;

public record ChatBoxDTO(
        Long id,
        String subject,
        String status,
        String studentName,
        String adminName,
        LocalDateTime lastMessageAt,
        LocalDateTime createdAt
) {
}
