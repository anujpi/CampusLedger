package org.anuj.miniprojectfintech.payment;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/student")
public class PaymentController {
    private final PaymentService paymentService;

    // student makes a payment
    @PostMapping("/pay")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<PaymentReceipt> pay(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @Valid @RequestBody MakePaymentRequest request
            ){
        PaymentReceipt receipt = paymentService.makePayment(currentUser.getUser(),request);

        return ResponseEntity.ok(receipt);
    }
    @GetMapping("/payment-history")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<PaymentHistoryDTO>> history(
            @AuthenticationPrincipal MyCustomUserDetails currentUser
    ){
        return ResponseEntity.ok(paymentService.getPaymentHistory(currentUser.getUser()));
    }
    @GetMapping("/payment-history/semester/{semester}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<PaymentHistoryDTO>> historySemesterWise(
            @AuthenticationPrincipal MyCustomUserDetails currentUser,
            @PathVariable Integer semester
    ){
        return ResponseEntity.ok(paymentService.getSemesterWisePaymentHistory(currentUser.getUser(),semester));
    }
}
