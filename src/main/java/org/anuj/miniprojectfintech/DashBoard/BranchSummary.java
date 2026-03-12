package org.anuj.miniprojectfintech.DashBoard;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BranchSummary {
    private Long branchId;
    private String branchName;
    private long totalStudents;
}
