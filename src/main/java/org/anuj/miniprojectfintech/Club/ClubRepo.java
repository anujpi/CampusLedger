package org.anuj.miniprojectfintech.Club;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubRepo extends JpaRepository<Club, Long> {
    List<Club> findClubByIsActive(Boolean isActive);

    Club findClubByNameAndIsActive(String clubName, boolean b);
}
