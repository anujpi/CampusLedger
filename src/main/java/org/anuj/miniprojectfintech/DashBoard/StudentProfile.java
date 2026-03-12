package org.anuj.miniprojectfintech.DashBoard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record StudentProfile(
        String fullName,
        String email,
        Integer year,
        String branch,
        Boolean active,
        List<FeeHistoryItem> feeHistory,
        int pendingCount,
        int paidCount,
        int delayedCount
) {
    public record FeeHistoryItem(
            String feeTitle,
            Integer semester,
            BigDecimal amount,
            LocalDate dueDate,
            String status,
            LocalDate paidAt
    ){}
}
