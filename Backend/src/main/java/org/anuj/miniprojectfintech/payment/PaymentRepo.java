package org.anuj.miniprojectfintech.payment;

import org.anuj.miniprojectfintech.User.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepo extends JpaRepository<Payment,Long> {

    List<Payment> findByUser(User user);

    List<Payment> findByUserAndStudentFee_FeeRequest_Semester(User user, Integer semester);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE p.user = :user AND (p.studentFee.feeRequest.semester = :semester OR (p.event IS NOT NULL AND :semester IS NOT NULL))")
    List<Payment> findHistory(User user, Integer semester);
}
