package org.anuj.miniprojectfintech.Auth;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.Login.ChangePasswordRequest;
import org.anuj.miniprojectfintech.Login.LoginRequest;
import org.anuj.miniprojectfintech.Login.LoginResponse;
import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.User.UserRepo;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.anuj.miniprojectfintech.filter.JWTService;
import org.jspecify.annotations.Nullable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
@RequiredArgsConstructor
@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(@Valid LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.getEmail(),request.getPassword()));
        MyCustomUserDetails userDetails = (MyCustomUserDetails) auth.getPrincipal();
        User user = userDetails.getUser();
        String token = jwtService.generateToken(
                user.getEmail(),Boolean.TRUE.equals(user.getMustChangePassword())
        );
        return new LoginResponse(token,user.getRole().name(),
                Boolean.TRUE.equals(user.getMustChangePassword()));
    }
    @Transactional
    public void changePassword(@Nullable String email, @Valid ChangePasswordRequest request) {
        User user = userRepo.findByEmail(email).orElseThrow(()-> new RuntimeException("user not found"));
        if(!passwordEncoder.matches(request.getCurrentPassword(),user.getPassword())){
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepo.save(user);
    }

}
