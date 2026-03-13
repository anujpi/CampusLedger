package org.anuj.miniprojectfintech.DashBoard;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashBoardController {
    private final AdminDashBoardService admindashBoardService;
    // how many students in a year
    @GetMapping("/years")
    public ResponseEntity<List<YearSummary>> yearOverview(){
        return ResponseEntity.ok(admindashBoardService.getYearOverview());
    }
    @GetMapping("/year/{year}/branch")
    public ResponseEntity<List<BranchSummary>> branchesByYear(
            @PathVariable Integer year){
     return ResponseEntity.ok(admindashBoardService.getBranchesByYear(year));
    }
    @GetMapping("/year/{year}/branch/{branchId}")
    public ResponseEntity<List<StudentSummary>> studentsByYearAndBranch(
            @PathVariable Integer year,
            @PathVariable Long branchId
    ){
        return ResponseEntity.ok(admindashBoardService
                .getStudentsByYearAndBranch(year,branchId
                ));
    }@GetMapping("/student/{studentId}")
    public ResponseEntity<StudentProfile> getStudentProfile(
            @PathVariable Long studentId
    ){
        return ResponseEntity.ok(admindashBoardService.getStudentProfile(studentId));
    }

}
