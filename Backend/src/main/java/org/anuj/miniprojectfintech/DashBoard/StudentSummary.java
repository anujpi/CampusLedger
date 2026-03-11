package org.anuj.miniprojectfintech.DashBoard;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentSummary {
    private Long id;
    private String fullName;
    private String email;
    private String year;
    private String branch;
    private Boolean active;
    private long pendingFees;
    private long totalFees;
}
