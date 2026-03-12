package org.anuj.miniprojectfintech.payment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.anuj.miniprojectfintech.User.Branch;

import java.math.BigDecimal;
import java.time.LocalDate;

// admin control powers to send fee request to students
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class FeeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(length = 1000)
    private String description;
    @Column(nullable = false)
    private BigDecimal amount; // 32 bit size
    @Column(nullable = false)
    private LocalDate dueDate;
    @Column(nullable = false)
    private Integer targetYear;
    @Column(nullable = false)
    private Integer semester;
    @ManyToOne
    @JoinColumn(name = "branch_id",
            nullable = false)
    private Branch targetBranch;
    @Column(nullable = false)
    private LocalDate createdAt;

    @PrePersist
    protected void onCreate(){
        this.createdAt = LocalDate.now();
    }
}
