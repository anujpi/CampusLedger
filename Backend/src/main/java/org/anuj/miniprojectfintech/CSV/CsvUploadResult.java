package org.anuj.miniprojectfintech.CSV;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class CsvUploadResult {
    private int imported;
    private int failed;
    private List<String> errors;
    private List<Map<String,String>> generatedPassword;
}
