package org.anuj.miniprojectfintech.Club;

import lombok.RequiredArgsConstructor;
import org.anuj.miniprojectfintech.config.MyCustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/club")
public class ClubController {
    private final ClubService clubService;
    // to add new clubs
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/new")
    public ResponseEntity<String> newClub(@RequestBody NewClubDTO newClubDTO){
        return ResponseEntity.ok(clubService.addNewCLub(newClubDTO));
    }
    // to add leaders to a club
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/addleaders/{clubId}/{userId}")
    public ResponseEntity<String> addLeaders(@PathVariable Long clubId, @PathVariable Long userId){
        return ResponseEntity.ok(
                clubService.addLeader(clubId,userId)
        );
    }//to add coleaders
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/addColeaders/{clubId}/{userId}")
    public ResponseEntity<String> addCoLeaders(@PathVariable Long clubId, @PathVariable Long userId){
        return ResponseEntity.ok(
                clubService.addCoLeader(clubId,userId)
        );
    }
    // add members to the clubs ( only those with the role of leader and coLeaders)
    // request -> accept/reject and then add
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/add/{clubId}/{userId}")
    public ResponseEntity<String> addMembers(@PathVariable Long clubId, @PathVariable Long userId, @AuthenticationPrincipal MyCustomUserDetails currentUser){
        return ResponseEntity.ok(clubService.addMembers(clubId,userId,currentUser.getUser()));
    }
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/request")
    public ResponseEntity<ResponseDTO> sendRequestToClub(@RequestBody requestDTO rdto,@AuthenticationPrincipal MyCustomUserDetails currentUser){
        return ResponseEntity.ok(clubService.sendRequestClub(rdto,currentUser.getUser()));
    }
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/accept/{clubId}/{userId}")
    public ResponseEntity<ResponseDTO> acceptRequest(@AuthenticationPrincipal MyCustomUserDetails currentUser,@PathVariable Long clubId,@PathVariable Long userId){
        return ResponseEntity.ok(clubService.acceptRequest(currentUser.getUser(),clubId,userId));
    }
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/reject/{clubId}/{userId}")
    public ResponseEntity<String> rejectRequest(@AuthenticationPrincipal MyCustomUserDetails currentUser,@PathVariable Long clubId, @PathVariable Long userId) {
        return ResponseEntity.ok(clubService.rejectRequest(currentUser.getUser(), clubId, userId));
    }
    @GetMapping("/find/all")
    public ResponseEntity<List<Club>> viewAllClubs(){
        return ResponseEntity.ok(clubService.viewAllClubs());
    }
    @GetMapping("/find/{clubName}")
    public ResponseEntity<Club> findClubByName(@PathVariable String clubName){
        return ResponseEntity.ok(clubService.viewClubByName(clubName));
    }
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/get/applicants/{clubId}")
    public ResponseEntity<List<ClubMember>> viewAllApplicants(@PathVariable Long clubId,@AuthenticationPrincipal MyCustomUserDetails currentUser){
        return ResponseEntity.ok(clubService.viewAllApplicants(clubId,currentUser.getUser()));
    }
    @GetMapping("/members/{clubId}")
    public ResponseEntity<List<ClubMember>> viewAllMembers(@PathVariable Long clubId){
        return ResponseEntity.ok(clubService.viewAllMembers(clubId));
    }

}
