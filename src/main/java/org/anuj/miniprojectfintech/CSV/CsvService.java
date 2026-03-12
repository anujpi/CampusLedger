package org.anuj.miniprojectfintech.CSV;

import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CsvService {
    private final UserRepo userRepo;
    private final BranchRepo branchRepo;
    private final PasswordEncoder passwordEncoder;

    public CsvUploadResult importStudents(MultipartFile file) throws IOException {
        List<String> errors = new ArrayList<>();
        List<User> toSave  = new ArrayList<>();
        List<java.util.Map<String, String>> generatedPasswords = new ArrayList<>();

        try(CSVReader reader = new CSVReader(
                new InputStreamReader(file.getInputStream())
        )){
            reader.readNext();
            String[] line;
            int row = 1;
            while((line = reader.readNext())!=null){
                row++;
                try{
                    String fullName = line[0].trim();
                    String email = line[1].trim();
                    if (userRepo.findByEmail(email).isPresent()) {
                        errors.add("Row " + row + ": Email already exists - " + email);
                        continue;
                    }
                    String year = line[2].trim();
                    String branchName = line[3].trim();
                    LocalDate joinDate = LocalDate.parse(line[4].trim(),
                            java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                    Branch branch = branchRepo.findByCourse(branchName).orElseGet(
                            ()->{
                                Branch b = new Branch();
                                b.setCourse(branchName);
                                b.setCreatedAt(LocalDate.now());
                                return branchRepo.save(b);
                            }
                    );
                    String rawPassword = generatePassword();
                    User student = new User();
                    student.setFullName(fullName);
                    student.setEmail(email);
                    student.setYear(year);
                    student.setBranch(branch);
                    student.setJoinInDate(joinDate);
                    student.setRole(Role.STUDENT);
                    student.setActive(true);
                    student.setMustChangePassword(true);
                    student.setPassword(passwordEncoder.encode(rawPassword));
                    toSave.add(student);
                    generatedPasswords.add(java.util.Map.of("email", email, "password", rawPassword));
                }catch (Exception e){
                    errors.add("Row "+row+": " +e.getMessage());
                }
            }
            userRepo.saveAll(toSave);
        }catch(Exception e){
            throw new RuntimeException("Failed to parse CSV: "+e.getMessage());
        }
        return new CsvUploadResult(toSave.size(),errors.size(),errors,generatedPasswords);
     }

    private String generatePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for(int i = 0 ;i<10;i++){
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
