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
    private long totalFees;
    private long pendingFees;
    private long paidFees;
    private BigDecimal totalDue;
    private BigDecimal totalPaid;

}
