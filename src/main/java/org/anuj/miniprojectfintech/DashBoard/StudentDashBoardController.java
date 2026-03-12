package org.anuj.miniprojectfintech.DashBoard;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.anuj.miniprojectfintech.payment.StudentFee;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('STUDENT')")
public class StudentDashBoardController {
    private final StudentDashBoardService studentDashBoardService;

    @GetMapping("/student/overview")
    public ResponseEntity<StudentDashBoardSummary> overview(
            @AuthenticationPrincipal MyCustomUserDetails currentUser
            ){
        return ResponseEntity.ok(studentDashBoardService.getOverview(currentUser.getUser()));
    }
    // check fees based on semester
    @GetMapping("/student/semesterwise/{semester}")
    public ResponseEntity<List<StudentFee>> semesterWise(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Integer semester
    ){
        return ResponseEntity.ok(studentDashBoardService.getSemesterWiseOverview(currentUser.getUser(),semester));
    }
    // check for pending status
    @GetMapping("/students/pendingfees")
    public ResponseEntity<List<StudentFee>> pendingFee(@AuthenticationPrincipal MyCustomUserDetails currentUser){
        return ResponseEntity.ok(studentDashBoardService.getPendingFee(currentUser.getUser()));
    }
}

