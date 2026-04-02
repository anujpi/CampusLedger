package org.anuj.miniprojectfintech.Club;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ClubMemberRepo extends JpaRepository<ClubMember, Long> {
    List<ClubMember> findByClubId(Long clubId);
    List<ClubMember> findByUserId(Long userId);
    int countByClubId(Long clubId);
    boolean existsByClubIdAndRole(Long clubId, ClubRole clubRole);

    boolean existsByClubIdAndUserId(Long clubId, Long userId);

    boolean existsByStatus(MemberShipStatus memberShipStatus);

    boolean existsByClubIdAndUserIdAndRole(Long clubId, Long id, ClubRole clubRole);

    boolean existsByClubIdAndUserIdAndStatus(Long clubId, Long senderId, MemberShipStatus memberShipStatus);

    boolean existsByStatusAndUserId(MemberShipStatus memberShipStatus, Long senderId);

    Optional<ClubMember>findByClubIdAndUserId(Long clubId,Long  userId);
}
