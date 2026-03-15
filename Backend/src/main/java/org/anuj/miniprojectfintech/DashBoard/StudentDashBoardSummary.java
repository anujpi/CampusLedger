package org.anuj.miniprojectfintech.DashBoard;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
@Getter
@AllArgsConstructor
public class StudentDashBoardSummary {
    private String fullName;
    private String branch;
    private String year;
    private long totalFeesCount;
    private long pendingCount;
    private long paidCount;
    private BigDecimal totalDue;
    private BigDecimal totalPaid;

}
