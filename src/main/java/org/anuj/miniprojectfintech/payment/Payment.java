package org.anuj.miniprojectfintech.payment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.anuj.miniprojectfintech.Event.Event;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name ="student_fee_id")
    private StudentFee studentFee;
    @ManyToOne
    @JoinColumn(name = "event_id",nullable = true)
    private Event event;

    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    private PaymentGateway paymentGateway;

    private String transactionId;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    private Boolean isDelayed;

    private LocalDate paidAt;
}
