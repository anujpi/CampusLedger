package org.anuj.miniprojectfintech.CSV;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.util.List;

@RequestMapping("/api/admin/csv")
@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CsvController {
    private final CsvService csvService;
    private final CredentialRepo credentialRepo;
    @PostMapping("/import-students")
    public ResponseEntity<CsvUploadResult> importStudents(
            @RequestParam("file")MultipartFile file){
        try{
            CsvUploadResult result = csvService.importStudents(file);
            return ResponseEntity.ok(result);
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }
    }
    @GetMapping("/download-credentials")
    public void downloadCredentials(HttpServletResponse response) throws IOException{
        List<CredentialRecord> credentialRecords = credentialRepo.findByDownloadedFalse();
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition","attachment; filename = student-credentials.csv");
        PrintWriter writer = response.getWriter();
        writer.println("email,password");
        for(CredentialRecord record : credentialRecords){
            writer.println(record.getEmail() + "," + record.getRawPassword());
            record.setDownloaded(true);
        }
        credentialRepo.saveAll(credentialRecords);
        writer.flush();
    }
    @GetMapping("/pending-credentials-count")
    public ResponseEntity<Long> pendingCount() {
        return ResponseEntity.ok(credentialRepo.countByDownloadedFalse());
    }
}
