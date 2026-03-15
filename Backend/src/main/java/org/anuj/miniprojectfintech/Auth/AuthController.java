package org.anuj.miniprojectfintech.Auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.Login.ChangePasswordRequest;
import org.anuj.miniprojectfintech.Login.LoginRequest;
import org.anuj.miniprojectfintech.Login.LoginResponse;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
        return ResponseEntity.ok(authService.login(request));
    }
    @PostMapping("/change-password")
    public ResponseEntity<Map<String,String>> changePassword(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @Valid @RequestBody ChangePasswordRequest request
            ){
        authService.changePassword(currentUser.getUsername(),request);
        return ResponseEntity.ok(Map.of("message","Password changed successfully"));
    }
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @AuthenticationPrincipal MyCustomUserDetails currentUser
    ) {
        var user = currentUser.getUser();
        return ResponseEntity.ok(Map.of(
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole().name(),
                "mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword())
        ));
    }
}
