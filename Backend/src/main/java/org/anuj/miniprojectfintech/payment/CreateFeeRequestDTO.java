package org.anuj.miniprojectfintech.payment;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreateFeeRequestDTO {
    @NonNull
    private String title;

    private String description;
    @NonNull
    @Positive
    private BigDecimal amount;
    @NonNull
    @Future
    private LocalDate dueDate;
    @NonNull
    @Min(1)@Max(4)
    private Integer targetYear;
    @NonNull
    @Min(1)@Max(8)
    private Integer semester;
    @NonNull
    private Long branchId;
}
