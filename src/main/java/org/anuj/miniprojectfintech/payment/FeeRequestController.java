package org.anuj.miniprojectfintech.payment;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class FeeRequestController {
    private final FeeRequestService feeRequestService;

    // admin -> create a fee request
    @PostMapping("/admin/fee-request")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeRequestSummary> create(
            @Valid @RequestBody CreateFeeRequestDTO dto
    ){
        return ResponseEntity.ok(feeRequestService.createAndFanOut(dto));
    }
    //admin to see all fee requests for a given year
    @GetMapping("/admin/fee-request/year/{year}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeeRequest>> getByYear(@PathVariable Integer year){
        return ResponseEntity.ok(feeRequestService.getByYear(year));
    }
    @GetMapping("/student/fees")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<StudentFee>> myFees(
            @AuthenticationPrincipal MyCustomUserDetails currentUser
            ){
        return ResponseEntity.ok(feeRequestService.getStudentFees(currentUser.getUser()));
    }
    @GetMapping("/students/fees/semester/{semester}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<StudentFee>> myFeesBySemester(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Integer semester
    ){
        return ResponseEntity.ok(feeRequestService.getMySemesterFees(currentUser.getUser(),semester));
    }
}
