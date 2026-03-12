package org.anuj.miniprojectfintech.chatBox;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateChatBoxRequest {
    @NotBlank
    @Size(max = 200)
    private String subject;
    @NotBlank
    @Size(max = 2000)
    private String firstMessage;
}
