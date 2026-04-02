package org.anuj.miniprojectfintech.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.lang.ScopedValue;
import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User,Long> {
    Optional<User> findByEmail(String email);

    List<User> findByYearAndBranchAndActiveTrue(String year, Branch branch);
    @Query("SELECT DISTINCT u.year FROM User u WHERE u.role= 'STUDENT'")
    List<String>findDistinctYears();

    List<User> findByYearAndRole(String year, Role role);

    Optional<User>findByfullname(String name);
}
