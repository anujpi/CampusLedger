package org.anuj.miniprojectfintech.Login;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    @Email @NotBlank
    private String email;
    @NotBlank
    private String password;
}
