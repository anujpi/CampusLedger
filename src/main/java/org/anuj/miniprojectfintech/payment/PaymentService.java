package org.anuj.miniprojectfintech.payment;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.Event.Event;
import org.anuj.miniprojectfintech.Event.EventMember;
import org.anuj.miniprojectfintech.Event.EventMemberRepo;
import org.anuj.miniprojectfintech.Event.MakeEventPaymentRequest;
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
    private final EventMemberRepo eventMemberRepo;

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
        payment.setUser(user);
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
        // Collect payments via direct user_id link (new records)
        List<Payment> byUser = paymentRepo.findByUser(user);
        // Collect payments via studentFee.student link (old records before user_id was added)
        List<Payment> byStudentFee = paymentRepo.findByStudentFee_Student(user);

        // Merge, deduplicate by id
        java.util.Set<Long> seen = new java.util.HashSet<>();
        java.util.List<Payment> all = new java.util.ArrayList<>();
        for (Payment p : byUser) { if (seen.add(p.getId())) all.add(p); }
        for (Payment p : byStudentFee) { if (seen.add(p.getId())) all.add(p); }

        return all.stream()
                .map(p -> new PaymentHistoryDTO(
                        p.getTransactionId(),
                        p.getStudentFee() != null ? p.getStudentFee().getFeeRequest().getTitle() : (p.getEvent() != null ? p.getEvent().getName() : "Unknown"),
                        p.getStudentFee() != null ? p.getStudentFee().getFeeRequest().getSemester() : null,
                        p.getAmount(),
                        p.getPaymentMode().name(),
                        p.getPaidAt(),
                        p.getIsDelayed()
                )).collect(Collectors.toList());
    }

    @Transactional
    public List<PaymentHistoryDTO> getSemesterWisePaymentHistory(User user, Integer semester) {
        // Same dual fetch + merge
        java.util.Set<Long> seen = new java.util.HashSet<>();
        java.util.List<Payment> all = new java.util.ArrayList<>();
        for (Payment p : paymentRepo.findByUser(user)) { if (seen.add(p.getId())) all.add(p); }
        for (Payment p : paymentRepo.findByStudentFee_Student(user)) { if (seen.add(p.getId())) all.add(p); }

        return all.stream()
                .filter(p -> p.getStudentFee() == null || p.getStudentFee().getFeeRequest().getSemester().equals(semester))
                .map(p -> new PaymentHistoryDTO(
                        p.getTransactionId(),
                        p.getStudentFee() != null ? p.getStudentFee().getFeeRequest().getTitle() : (p.getEvent() != null ? p.getEvent().getName() : "Unknown"),
                        p.getStudentFee() != null ? p.getStudentFee().getFeeRequest().getSemester() : semester,
                        p.getAmount(),
                        p.getPaymentMode().name(),
                        p.getPaidAt(),
                        p.getIsDelayed()
                )).collect(Collectors.toList());
    }
    // payment for events
    @Transactional
    public PaymentReceipt makeEventPayment(User user , @Valid MakeEventPaymentRequest request){
        EventMember member = eventMemberRepo.findById(request.eventMemberId()).orElseThrow(()->new RuntimeException("Event registeration not found"));
        if(!member.getUser().getId().equals(user.getId())){
            throw new RuntimeException("This event registration doesnt belong to you");
        }
        if(Boolean.TRUE.equals(member.getPaymentDone())){
            throw new RuntimeException("Payment already completed for this registration");
        }
        Event event = member.getEvent();

        if(!Boolean.TRUE.equals(event.getPaid()) || event.getAmount() == null || event.getAmount().signum() <= 0){
            throw new RuntimeException("This event does not require payments");
        }
        LocalDate today = LocalDate.now();
        String transactionId = "TXN-"+UUID.randomUUID().toString().substring(0,8).toUpperCase();
        Payment payment = new Payment();
        payment.setEvent(event);
        payment.setUser(user);
        payment.setAmount(event.getAmount());
        payment.setPaymentMode(request.paymentMode());
        payment.setPaymentGateway(PaymentGateway.MANUAL);
        payment.setTransactionId(transactionId);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setIsDelayed(false);
        payment.setPaidAt(today);
        paymentRepo.save(payment);
        member.setPaymentDone(true);
        member.setPaymentTxnId(transactionId);
        eventMemberRepo.save(member);
        return new PaymentReceipt(
                transactionId,
                user.getFullName(),
                event.getName(),
                null,
                event.getAmount(),
                request.paymentMode(),
                PaymentStatus.SUCCESS,
                false,
                today
        );
    }
}
