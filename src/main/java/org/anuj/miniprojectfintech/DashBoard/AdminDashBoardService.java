package org.anuj.miniprojectfintech.DashBoard;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.*;
import org.anuj.miniprojectfintech.payment.FeeStatus;
import org.anuj.miniprojectfintech.payment.StudentFee;
import org.anuj.miniprojectfintech.payment.StudentFeeRepo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class AdminDashBoardService {
    private final UserRepo userRepo;
    private final BranchRepo branchRepo;
    private final StudentFeeRepo studentFeeRepo;

    // year
    public List<YearSummary> getYearOverview() {
        return userRepo.findDistinctYears().stream().map(year->{
            List<User> students = userRepo.findByYearAndRole(year, Role.STUDENT);
            long active = students.stream().filter(
                    s->Boolean.TRUE.equals(s.getActive()))
                    .count();

            return new YearSummary(year,students.size(),active);
        }).collect(Collectors.toList());
    }
    //year->branches
    public List<BranchSummary> getBranchesByYear(Integer year) {
        List<Branch> branches = branchRepo.findAll();
        return branches.stream().map(branch -> {
            List<User> students = userRepo.findByYearAndBranchAndActiveTrue(String.valueOf(year),branch);
            return new BranchSummary(
                    branch.getId(),branch.getCourse(),students.size()
            );
        }).filter(b->b.getTotalStudents()>0).collect(Collectors.toList());
    }
    // year->branches->student
    @Transactional
    public List<StudentSummary> getStudentsByYearAndBranch(Integer year, Long branchId) {
        Branch branch = branchRepo.findById(branchId).orElseThrow(()->new RuntimeException("Branch not found"));
        List<User> students = userRepo.findByYearAndBranchAndActiveTrue(
                String.valueOf(year),branch
        );
        return  students.stream().map(student->{
            List<StudentFee> fees = studentFeeRepo.findByStudent(student);
            long pending = fees.stream().filter(f->f.getFeeStatus()
            == FeeStatus.PENDING
                    ).count();
            return new StudentSummary(
                    student.getId(),
                    student.getFullName(),
                    student.getEmail(),
                    student.getYear(),
                    branch.getCourse(),
                    student.getActive(),
                    pending,
                    fees.size()
            );
        }).collect(
                Collectors.toList()

        );
    }

    @Transactional
    public StudentProfile getStudentProfile(Long studentId) {
        User student = userRepo.findById(studentId).orElseThrow(()->new RuntimeException("Student not found"));

        List<StudentFee> fees = studentFeeRepo.findByStudent(student);

        long pending = fees.stream().filter(f->f.getFeeStatus() == FeeStatus.PENDING).count();
        long paid = fees.stream().filter(f->f.getFeeStatus() == FeeStatus.PAID).count();
        long delayed = fees.stream().filter(f->f.getFeeStatus() == FeeStatus.DELAYED).count();
        List<StudentProfile.FeeHistoryItem> feeHistory = fees.stream()
                .map(f->new StudentProfile.FeeHistoryItem(
                        f.getFeeRequest().getTitle(),
                        f.getFeeRequest().getSemester(),
                        f.getAmount(),
                        f.getDueDate(),
                        f.getFeeStatus().name(),
                        f.getPaidAt()
                )).collect(Collectors.toList());
        return new StudentProfile(
                student.getFullName(),
                student.getEmail(),
                Integer.parseInt(student.getYear()),
                student.getBranch().getCourse(),
                student.getActive(),
                feeHistory,
                (int) pending,
                (int) paid,
                (int) delayed
        );
    }
}
