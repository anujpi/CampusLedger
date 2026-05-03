package org.anuj.miniprojectfintech;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.Map;

public class GenerateToken {
    public static void main(String[] args) {
        String SECRET_KEY = "mySuperSecretKeyThatIsVeryLongForJwtSecurity";
        String token = Jwts.builder()
                .claims(Map.of("mustChangePassword",false))
                .subject("anujpandita2605@gmail.com") // Assuming this is a user
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*60*24))
                .signWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
                .compact();
        System.out.println(token);
    }
}
