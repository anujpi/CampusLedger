package org.anuj.miniprojectfintech.DashBoard;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.anuj.miniprojectfintech.payment.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentDashBoardService {

    private final StudentFeeRepo studentFeeRepo;
    private final FeeRequestRepo feeRequestRepo;

    public StudentDashBoardSummary getOverview(User student) {
        List<StudentFee> allFees = studentFeeRepo.findByStudent(student);
        long pending = allFees.stream().filter(f->f.getFeeStatus()== FeeStatus.PENDING).count();
        long paid = allFees.stream().filter(f->f.getFeeStatus()==FeeStatus.PAID).count();
        BigDecimal totalDue = allFees.stream().filter(f->f.getFeeStatus()==FeeStatus.PENDING)
                .map(StudentFee::getAmount)
                .reduce(BigDecimal.ZERO,BigDecimal::add);
        BigDecimal totalPaid = allFees.stream().filter(f->f.getFeeStatus()==FeeStatus.PAID
                )
                .map(StudentFee::getAmount)
                .reduce(BigDecimal.ZERO,BigDecimal::add);
        return new StudentDashBoardSummary(
                student.getFullName(),
                student.getBranch().getCourse(),
                student.getYear(),
                allFees.size(),
                pending,
                paid,
                totalDue,
                totalPaid
        );
    }
    @Transactional
    public List<StudentFee> getSemesterWiseOverview(User user, Integer semester) {
       return studentFeeRepo.findByStudentAndFeeRequest_Semester(user,semester);
    }

    public List<StudentFee> getPendingFee(User student) {
        return studentFeeRepo.findByStudentAndFeeStatus(student,FeeStatus.PENDING);
    }
}
