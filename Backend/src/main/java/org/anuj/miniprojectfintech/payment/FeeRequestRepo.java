package org.anuj.miniprojectfintech.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeRequestRepo extends JpaRepository<FeeRequest, Long> {
    List<FeeRequest> findByTargetYear(Integer year);
}
