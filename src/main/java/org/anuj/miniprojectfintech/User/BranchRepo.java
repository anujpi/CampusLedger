package org.anuj.miniprojectfintech.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BranchRepo extends JpaRepository<Branch,Long> {
    Optional<Branch> findByCourse(String branchName);
}
