package org.anuj.miniprojectfintech.Event;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.Club.Club;
import org.anuj.miniprojectfintech.Club.ClubRepo;
import org.anuj.miniprojectfintech.User.User;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventAcceptService{
    private final EventMemberRepo eventMemberRepo;
    private final ClubRepo clubRepo;
    private final EventRepo eventRepo;

    @Transactional
    public EventAcceptResponse acceptEventRequest(Long clubId, EventMemberDTO memberDTO, User currentUser) {
        Club club = clubRepo.findById(clubId).orElseThrow(() -> new RuntimeException("Club not found"));
        if (!Boolean.TRUE.equals(club.getIsActive())) {
            throw new RuntimeException("Club is not active");
        }
        Event event = eventRepo.findByIdAndClub_id(memberDTO.eventId(), club.getId()).orElseThrow(() -> new RuntimeException("Event doesnt exist"));
        validateEventRegistrationWindow(event);
        if(eventMemberRepo.existsByUserIdAndEventId(currentUser.getId(),event.getId())){
            throw new RuntimeException("Already registered");
        }
        EventMember member = new EventMember();
        member.setUser(currentUser);
        member.setClub(club);
        member.setEvent(event);
        member.setTeamName(memberDTO.teamName());
        member.setTeamDetails(memberDTO.teamDetails());
        boolean requiresPayment = Boolean.TRUE.equals(event.getPaid()) && event.getAmount() != null && event.getAmount().signum() > 0;
        if (!requiresPayment) {
            member.setPaymentDone(true);
        }
        member = eventMemberRepo.save(member);
        if(requiresPayment){
            return new EventAcceptResponse(
                    true,
                    "Payment required",
                    member.getId(),
                    event.getAmount(),
                    "INR"
            );
        }
        return new EventAcceptResponse(
                false,
                "Successfully registered for the event",
                member.getId(),
                BigDecimal.ZERO,
                "INR"
        );

    }
    @Transactional
    public String unregisterEvent(Long eventId,Long clubId,User currentUser){
        Event event = eventRepo.findByIdAndClub_id(eventId,clubId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        EventMember member = eventMemberRepo.findByUserIdAndEventId(currentUser.getId(),event.getId())
                .orElseThrow(() -> new RuntimeException("Registration not found"));
        eventMemberRepo.delete(member);
        return "Registration cancelled";
    }
    @Transactional
    public String markPaymentSuccess(Long eventMemberId,String txnId,User currentUser){
        EventMember member = eventMemberRepo.findById(eventMemberId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));
        if(!member.getUser().getId().equals(currentUser.getId())){
            throw new RuntimeException("Not allowed");
        }
        if(Boolean.TRUE.equals(member.getPaymentDone())){
            throw new RuntimeException("Payment already marked for this registration");
        }
        member.setPaymentDone(true);
        member.setPaymentTxnId(txnId);
        eventMemberRepo.save(member);
        return "Payment marked successfully";
    }
    private void validateEventRegistrationWindow(Event event){
        LocalDateTime now = LocalDateTime.now();
        if(event.getLastRegisterAt()!=null && now.isAfter(event.getLastRegisterAt())){
            throw new RuntimeException("Registration closed");
        }
        if(event.getDueAt() != null && now.isAfter(event.getDueAt())){
            throw new RuntimeException("Event already ended");
        }
    }
}
