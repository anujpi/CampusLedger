package org.anuj.miniprojectfintech.Club;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.User.User;
import org.anuj.miniprojectfintech.User.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@RequiredArgsConstructor
@Service
public class ClubService {
    private final ClubRepo clubRepo;
    private final UserRepo userRepo;
    private final ClubMemberRepo clubMemberRepo;
    public String addNewCLub(NewClubDTO newClubDTO) {
        Club club = new Club();
        club.setName(newClubDTO.name());
        club.setDescription(newClubDTO.description());
        clubRepo.save(club);
        return "New Club By the name " + club.getName() + "is successfully added";
    }

    public String addLeader(Long clubId, Long userId) {
        Club club = clubRepo.findById(clubId).orElseThrow(()->new RuntimeException("Club not found"));
        User user = userRepo.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
        ClubMember clubMember = new ClubMember();
        if(!clubMemberRepo.existsByClubIdAndRole(clubId,ClubRole.LEADER)){
            clubMember.setClub(club);
            clubMember.setUser(user);
            clubMember.setRole(ClubRole.LEADER);
            clubMemberRepo.save(clubMember);
            return "Club Leader has been added for the club"+club.getName();
        }
        return "Invalid input";
    }

    public String addCoLeader(Long clubId, Long userId) {
        Club club = clubRepo.findById(clubId).orElseThrow(()->new RuntimeException("Club not found"));
        User user = userRepo.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
        ClubMember clubMember = new ClubMember();
        if(!clubMemberRepo.existsByClubIdAndRole(clubId,ClubRole.CO_LEADER)){
            clubMember.setClub(club);
            clubMember.setUser(user);
            clubMember.setRole(ClubRole.CO_LEADER);
            clubMemberRepo.save(clubMember);
            return "Club CoLeader has been added for the club"+club.getName();
        }
        return "Invalid input";
    }

    public String addMembers(Long clubId, Long userId,User student) {
        Club club = clubRepo.findById(clubId).orElseThrow(()->new RuntimeException("Club not found"));
        User user = userRepo.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
        ClubMember clubMember = new ClubMember();
        if(!validateLeaderAndCoLeader(student,clubId)){
            throw new RuntimeException("Not Allowed");
        }
        if(!clubMemberRepo.existsByClubIdAndUserId(clubId,userId)){
            clubMember.setClub(club);
            clubMember.setUser(user);
            clubMember.setRole(ClubRole.MEMBER);
            clubMemberRepo.save(clubMember);
            return "A new Club Member is successfully added";
        }
        return "The User is already a member";
    }
    @Transactional
    public ResponseDTO sendRequestClub(requestDTO rdto,User student) {
        User user = userRepo.findByfullname(rdto.name()).orElseThrow(()->new RuntimeException("User not found"));
        Club club = clubRepo.findById(rdto.clubId()).orElseThrow(()->new RuntimeException("Club doesn't exist"));
        if(!Objects.equals(student.getFullName(), rdto.name())){
            throw new RuntimeException("Not allowed");
        }
        if(clubMemberRepo.existsByClubIdAndUserId(club.getId(), user.getId())){
            throw new RuntimeException("Already part of this club");
        }
        if(clubMemberRepo.existsByStatus(MemberShipStatus.ACTIVE)){
            throw new RuntimeException("Not Allowed");
        }
        ClubMember clubMember = new ClubMember();
        clubMember.setUser(user);
        clubMember.setStatus(MemberShipStatus.PENDING);
        clubMember.setClub(club);
        clubMemberRepo.save(clubMember);
        return new ResponseDTO(clubMember.getId(),clubMember.getClub().getId(),clubMember.getUser().getId(),clubMember.getStatus());
    }
    @Transactional
    public ResponseDTO acceptRequest(User student, Long clubId,Long senderId) {
        Club club = clubRepo.findById(clubId).orElseThrow(()->new RuntimeException("Club not found"));
        ClubMember clubMember = clubMemberRepo.findById(senderId).orElseThrow(()->new RuntimeException("Club member not found"));
        if(validateLeaderAndCoLeader(student,clubId)){
            throw new RuntimeException("Not Allowed");
        }
        if(clubMember.getStatus() != MemberShipStatus.PENDING){
            throw new RuntimeException("Not Allowed");
        }
        clubMember.setRole(ClubRole.MEMBER);
        clubMember.setStatus(MemberShipStatus.ACTIVE);
        clubMemberRepo.save(clubMember);
        return new ResponseDTO(clubMember.getId(),clubMember.getClub().getId(),clubMember.getUser().getId(),clubMember.getStatus());
    }
    @Transactional
    public String rejectRequest(User student,Long clubId,Long senderId){
        Club club = clubRepo.findById(clubId).orElseThrow(()->new RuntimeException("Club not found"));
        ClubMember clubMember = clubMemberRepo.findById(senderId).orElseThrow(()->new RuntimeException("Club member not found"));
        if(validateLeaderAndCoLeader(student,clubId)){
            throw new RuntimeException("Not Allowed");
        }
        if(clubMember.getStatus() != MemberShipStatus.PENDING){
            throw new RuntimeException("Not Allowed");
        }
        clubMemberRepo.delete(clubMember);
        return "Sorry you have been rejected";
    }
    protected boolean validateLeaderAndCoLeader(User student,Long clubId){
        ClubMember clubMember = clubMemberRepo.findByClubIdAndUserId(clubId,student.getId()).orElseThrow(()->new RuntimeException("Club Member not found"));
        return clubMember.getRole() != ClubRole.LEADER && clubMember.getRole() != ClubRole.CO_LEADER;
    }

    public List<Club> viewAllClubs() {
        return clubRepo.findClubByIsActive(true);
    }
    public Club viewClubByName(String clubName){
        return clubRepo.findClubByNameAndIsActive(clubName,true);
    }

    public List<ClubMember> viewAllApplicants(Long clubId, User user) {
        if(!validateLeaderAndCoLeader(user,clubId)){
            throw new RuntimeException("Not allowed");
        }
        return clubMemberRepo.findByClubIdAndStatus(clubId,MemberShipStatus.PENDING);
    }

    public List<ClubMember> viewAllMembers(Long clubId) {
        return clubMemberRepo.findByClubIdAndStatus(clubId,MemberShipStatus.ACTIVE);
    }
}
