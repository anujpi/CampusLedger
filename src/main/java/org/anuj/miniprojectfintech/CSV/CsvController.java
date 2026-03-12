package org.anuj.miniprojectfintech.CSV;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RequestMapping("/api/admin")
@RestController
public class CsvController {
    @Autowired
    private CsvService csvService;
    @PostMapping("/import")
    public ResponseEntity<CsvUploadResult> importStudents(
            @RequestParam("file")MultipartFile file){
        try{
            CsvUploadResult result = csvService.importStudents(file);
            return ResponseEntity.ok(result);
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }
    }
}
