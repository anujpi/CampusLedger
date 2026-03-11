package org.anuj.miniprojectfintech.config;

import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.User.UserRepo;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class MyUserDetailsService implements UserDetailsService {
    private final UserRepo userRepo;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(email).orElseThrow(
                ()->new UsernameNotFoundException("User not found")
        );
        return new MyCustomUserDetails(user);
    }
}
