package org.anuj.miniprojectfintech.User;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class CreateAdmin {
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    @Bean
    public CommandLineRunner commandLineRunner(){
        return args -> {
            String adminEmail = "addmin@gmail.com";
            if(userRepo.findByEmail(adminEmail).isEmpty()){
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setFullName("System Admin");
                admin.setRole(Role.ADMIN);
                admin.setPassword(passwordEncoder.encode("addmin123"));
                admin.setActive(true);
                userRepo.save(admin);

                System.out.println("Super admin is created");
            }
        };
    }
}
