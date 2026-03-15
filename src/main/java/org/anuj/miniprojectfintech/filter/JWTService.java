package org.anuj.miniprojectfintech.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JWTService {
    private static final String SECRET_KEY = "mySuperSecretKeyThatIsVeryLongForJwtSecurity";

    private SecretKey getSigningKey(){
        byte[] keyBytes = SECRET_KEY.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
    public String generateToken(String username,boolean mustChangePassword){
        return Jwts.builder()
                .claims(Map.of("mustChangePassword",mustChangePassword))
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*60*24))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String subject = extractUsername(token);
        return subject.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }
}
