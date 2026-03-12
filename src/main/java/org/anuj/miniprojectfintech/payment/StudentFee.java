package org.anuj.miniprojectfintech.payment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.anuj.miniprojectfintech.User.User;

import java.math.BigDecimal;
import java.time.LocalDate;
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Getter
@Setter
public class StudentFee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "student_id")//->fk for knowing what student
    private User student;
    @ManyToOne// fk
    @JoinColumn(name = "fee_request")// fk for knowing what fee request
    private FeeRequest feeRequest;
    @Column(nullable = false)
    private LocalDate dueDate;
    @Column(nullable = false)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private FeeStatus feeStatus;
    private LocalDate paidAt;
    @Column(nullable = false)
    private LocalDate createdAt;
}
