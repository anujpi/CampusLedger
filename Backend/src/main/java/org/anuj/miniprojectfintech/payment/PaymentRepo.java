package org.anuj.miniprojectfintech.payment;

import org.anuj.miniprojectfintech.User.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepo extends JpaRepository<Payment,Long> {

    List<Payment> findByUser(User user);

    // Fetch old payments that were saved before user_id column existed (linked via studentFee.student)
    List<Payment> findByStudentFee_Student(User student);
}
