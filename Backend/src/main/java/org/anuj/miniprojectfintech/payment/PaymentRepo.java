package org.anuj.miniprojectfintech.payment;

import org.anuj.miniprojectfintech.User.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepo extends JpaRepository<Payment,Long> {

    List<Payment> findByStudentFee_Student(User user);

    List<Payment> findByStudentFee_StudentAndStudentFee_FeeRequest_Semester(User user, Integer semester);
}
