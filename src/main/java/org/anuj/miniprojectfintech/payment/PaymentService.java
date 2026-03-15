package org.anuj.miniprojectfintech.payment;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class PaymentService {
    private final PaymentRepo paymentRepo;
    private final StudentFeeRepo studentFeeRepo;
    @Transactional
    public PaymentReceipt makePayment(User user, @Valid MakePaymentRequest request) {
        //check if this student fee belongs to this student
        StudentFee studentFee = studentFeeRepo.findById(request.getStudentFeeId()).orElseThrow(()->new RuntimeException("Fee not found"));

        if(!studentFee.getStudent().getId().equals(user.getId())){
            throw new RuntimeException("This fee doesnt belong to you");
        }
        // check if the student has paid the amount
        if(studentFee.getFeeStatus() == FeeStatus.PAID){
            throw new RuntimeException("This fee is already paid");
        }
        // check if the payment is past the due date
        LocalDate today = LocalDate.now();
        boolean isDelayed = today.isAfter(studentFee.getDueDate());

        // now we need a mock id(maybe changed later)
        String transactionId = "TXN-"+ UUID.randomUUID().toString().substring(0,8).toUpperCase();

        Payment payment = new Payment();
        payment.setStudentFee(studentFee);
        payment.setAmount(studentFee.getAmount());
        payment.setPaymentMode(request.getPaymentMode());
        payment.setTransactionId(transactionId);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaymentGateway(PaymentGateway.MANUAL);//only for the time being
        payment.setIsDelayed(isDelayed);
        payment.setPaidAt(today);

        paymentRepo.save(payment);
        // updating studentfee status
        studentFee.setFeeStatus(FeeStatus.PAID);
        studentFee.setPaidAt(today);
        studentFeeRepo.save(studentFee);
        // receipt
        return new PaymentReceipt(
                transactionId,
                user.getFullName(),
                studentFee.getFeeRequest().getTitle(),
                studentFee.getFeeRequest().getSemester(),
                studentFee.getAmount(),
                request.getPaymentMode(),
                PaymentStatus.SUCCESS,
                isDelayed,
                today
        );
    }

    public List<PaymentHistoryDTO> getPaymentHistory(User user) {
        return paymentRepo.findByStudentFee_Student(user).stream()
                .map(p -> new PaymentHistoryDTO(
                        p.getTransactionId(),
                        p.getStudentFee().getFeeRequest().getTitle(),
                        p.getStudentFee().getFeeRequest().getSemester(),
                        p.getAmount(),
                        p.getPaymentMode().name(),
                        p.getPaidAt(),
                        p.getIsDelayed()
                )).collect(Collectors.toList());
    }
    @Transactional
    public List<PaymentHistoryDTO> getSemesterWisePaymentHistory(User user,Integer semester) {
        return paymentRepo.findByStudentFee_StudentAndStudentFee_FeeRequest_Semester(user, semester)
                .stream()
                .map(p -> new PaymentHistoryDTO(
                        p.getTransactionId(),
                        p.getStudentFee().getFeeRequest().getTitle(),
                        p.getStudentFee().getFeeRequest().getSemester(),
                        p.getAmount(),
                        p.getPaymentMode().name(),
                        p.getPaidAt(),
                        p.getIsDelayed()
                )).collect(Collectors.toList());    }
}
