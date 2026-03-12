package org.anuj.miniprojectfintech.payment;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.Branch;
import org.anuj.miniprojectfintech.User.BranchRepo;
import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.User.UserRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Service
public class FeeRequestService {
    private final BranchRepo branchRepo;
    private final FeeRequestRepo feeRequestRepo;
    private final UserRepo userRepo;
    private final StudentFeeRepo studentFeeRepo;

    public FeeRequestSummary createAndFanOut(@Valid CreateFeeRequestDTO dto) {
        Branch branch = branchRepo.findById(dto.getBranchId()).orElseThrow(()->new RuntimeException("branch not found"));

        FeeRequest feeRequest = new FeeRequest();
        feeRequest.setTitle(dto.getTitle());
        feeRequest.setDescription(dto.getDescription());
        feeRequest.setAmount(dto.getAmount());
        feeRequest.setDueDate(dto.getDueDate());
        feeRequest.setTargetYear(dto.getTargetYear());
        feeRequest.setSemester(dto.getSemester());
        feeRequest.setTargetBranch(branch);
        feeRequestRepo.save(feeRequest);

        // to find all the active students with matching year and branch
        List<User> students = userRepo.findByYearAndBranchAndActiveTrue(String.valueOf(dto.getTargetYear()),branch);
        // create a student fee for each student
        List<StudentFee> studentFees = new ArrayList<>();
        for(User student:students){
            // check whether the student is already present in the studentFeeRepo , if yes continue to the next student
            if(studentFeeRepo.existsByStudentAndFeeRequest(student,feeRequest)) continue;

            StudentFee studentFee = new StudentFee();
            studentFee.setStudent(student);
            studentFee.setFeeRequest(feeRequest);
            studentFee.setAmount(dto.getAmount());
            studentFee.setDueDate(dto.getDueDate());
            studentFee.setFeeStatus(FeeStatus.PENDING);
            studentFee.setCreatedAt(LocalDate.now());
            studentFees.add(studentFee);
        }
        studentFeeRepo.saveAll(studentFees);

        return new FeeRequestSummary(feeRequest.getId(),students.size(),studentFees.size());
    }

    public List<FeeRequest> getByYear(Integer year) {
        return feeRequestRepo.findByTargetYear(year);
    }

    public List<StudentFee> getStudentFees(User student) {
        return studentFeeRepo.findByStudent(student);
    }
    @Transactional
    public List<StudentFee> getMySemesterFees(User user, Integer semester) {
        return studentFeeRepo.findByStudentAndFeeRequest_Semester(user,semester);
    }
}
