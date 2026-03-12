package org.anuj.miniprojectfintech.payment;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FeeRequestSummary {

    private Long feeRequestId;

    private int studentsMatched;

    private int studentFeesCreated;
}
