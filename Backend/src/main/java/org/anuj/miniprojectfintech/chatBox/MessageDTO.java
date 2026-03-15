package org.anuj.miniprojectfintech.chatBox;

import java.time.LocalDateTime;

public record MessageDTO(
        Long id,
        String sender,
        String senderRole,
        String context,
        LocalDateTime sendAT
) {
}
