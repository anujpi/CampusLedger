package org.anuj.miniprojectfintech.payment;

import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentFeeRepo extends JpaRepository<StudentFee,Long> {
    boolean existsByStudentAndFeeRequest(User student, FeeRequest feeRequest);

    List<StudentFee> findByStudent(User user);

    List<StudentFee> findByStudentAndFeeRequest_Semester(User user, Integer semester);

    List<StudentFee> findByStudentAndFeeStatus(User student, FeeStatus feeStatus);
}
