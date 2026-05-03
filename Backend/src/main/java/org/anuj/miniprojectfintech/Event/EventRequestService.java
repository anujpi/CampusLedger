package org.anuj.miniprojectfintech.Event;

import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.Club.*;
import org.anuj.miniprojectfintech.User.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventRequestService {
    private final EventRepo eventRepo;
    private final EventMemberRepo eventMemberRepo;
    private final ClubRepo clubRepo;
    private final ClubMemberRepo clubMemberRepo;


    public String sendRequest(Long clubId, RequestDTO requestDTO, User student) {
        Club club = clubRepo.findById(clubId).orElseThrow(() -> new RuntimeException("Club not found"));
        if(!Boolean.TRUE.equals(club.getIsActive())){
            throw new RuntimeException("Club is not active");
        }
        if(!validateCoLeaderAndLeader(
                student,club.getId()
        )){
            throw new AccessDeniedException("Only Leaders and Co-Leaders can publish events");
        }
        Event event = new Event();
        event.setName(requestDTO.name());
        event.setDescription(requestDTO.description());
        event.setDueAt(requestDTO.dueDate());
        event.setClub(club);
        event.setSolo(requestDTO.solo());
        event.setTeamSize(requestDTO.teamSize());
        applyPaidConfiguration(event,requestDTO.amount());
        eventRepo.save(event);
        return "Event '"+event.getName()+"' created successfully!";
    }
    public String deleteRequest(User user, Long eventId, Long clubId) {
        if(!validateCoLeaderAndLeader(user,clubId)){
            throw new AccessDeniedException("Only Leaders and Co-Leaders are allowed to delete a request");
        }
        Event event = eventRepo.findByIdAndClub_id(eventId,clubId).orElseThrow(()->new RuntimeException("Event not found"));
        eventRepo.delete(event);
        return "Event has been successfully deleted";
    }
    public String updateEvent(Long eventId, Long clubId, RequestDTO requestDTO, User student) {
        if(!validateCoLeaderAndLeader(student,clubId)){
            throw new RuntimeException("Only Leaders and Co-Leaders are allowed to update an event");
        }
        Event event = eventRepo.findByIdAndClub_id(eventId,clubId).orElseThrow(() -> new RuntimeException("Event not found"));
        if(requestDTO.name() != null && !requestDTO.name().isBlank()){
            event.setName(requestDTO.name());
        }
        event.setDescription(requestDTO.description());
        event.setDueAt(requestDTO.dueDate());
        if(requestDTO.solo() != null) event.setSolo(requestDTO.solo());
        if(requestDTO.teamSize() != null) event.setTeamSize(requestDTO.teamSize());
        applyPaidConfiguration(event,requestDTO.amount());
        eventRepo.save(event);
        return "Event has been successfully updated";
    }
    public EventDetailsResponse getEventById(Long eventId,Long clubId,User student){
        Event event = eventRepo.findByIdAndClub_id(eventId,clubId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return toEventDetailsResponse(event);
    }
    public List<EventSummaryResponse> listEventsByClub(Long clubId,User student){
        Club club = clubRepo.findById(clubId).orElseThrow(() -> new RuntimeException("Club not found"));
        if(!Boolean.TRUE.equals(club.getIsActive())){
            throw new RuntimeException("Club is not active");
        }
        return eventRepo.findAllByClub_IdOrderByCreatedAtDesc(clubId)
                .stream()
                .map(this::toEventSummaryResponse)
                .toList();
    }
    public List<MyEventResponse> listMyRegisteredEvents(User student){
        return eventMemberRepo.findAllByUserId(student.getId())
                .stream()
                .map(this::toMyEventResponse)
                .toList();
    }
    public List<EventMemberResponse> listEventMembers(Long eventId,Long clubId,User student){
        if(!validateCoLeaderAndLeader(student,clubId)){
            throw new RuntimeException("Only Leaders and Co-Leaders are allowed to view event members");
        }
        Event event = eventRepo.findByIdAndClub_id(eventId,clubId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return eventMemberRepo.findAllByEventId(event.getId())
                .stream()
                .map(this::toEventMemberResponse)
                .toList();
    }
    protected boolean validateCoLeaderAndLeader(User student,Long clubId){
        ClubMember clubMember = clubMemberRepo.findByClubIdAndUserId(clubId,student.getId()).orElseThrow(()->new RuntimeException("Not found"));
        return clubMember.getRole() == ClubRole.CO_LEADER || clubMember.getRole() ==  ClubRole.LEADER;
    }
    private void applyPaidConfiguration(Event event,BigDecimal amount){
        if(amount != null && amount.signum() > 0) {
            event.setAmount(amount);
            event.setPaid(true);
            return;
        }
        event.setAmount(BigDecimal.ZERO);
        event.setPaid(false);
    }
    private EventSummaryResponse toEventSummaryResponse(Event event){
        return new EventSummaryResponse(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getDueAt(),
                Boolean.TRUE.equals(event.getPaid()),
                event.getAmount() == null ? BigDecimal.ZERO : event.getAmount(),
                event.getSolo(),
                event.getTeamSize()
        );
    }
    private EventDetailsResponse toEventDetailsResponse(Event event){
        return new EventDetailsResponse(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getCreatedAt(),
                event.getDueAt(),
                event.getLastRegisterAt(),
                Boolean.TRUE.equals(event.getPaid()),
                event.getAmount() == null ? BigDecimal.ZERO : event.getAmount(),
                event.getClub().getName(),
                event.getSolo(),
                event.getTeamSize()
        );
    }
    private MyEventResponse toMyEventResponse(EventMember eventMember){
        Event event = eventMember.getEvent();
        return new MyEventResponse(
                eventMember.getId(),
                event.getId(),
                event.getName(),
                eventMember.getClub().getName(),
                Boolean.TRUE.equals(event.getPaid()) && event.getAmount() != null && event.getAmount().signum() > 0,
                Boolean.TRUE.equals(eventMember.getPaymentDone())
        );
    }
    private EventMemberResponse toEventMemberResponse(EventMember eventMember){
        User user = eventMember.getUser();
        return new EventMemberResponse(
                eventMember.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                Boolean.TRUE.equals(eventMember.getPaymentDone()),
                eventMember.getTeamName(),
                eventMember.getTeamDetails()
        );
    }


}
