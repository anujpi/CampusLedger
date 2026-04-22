package org.anuj.miniprojectfintech.Event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventMemberRepo extends JpaRepository<EventMember,Long> {
    boolean existsByUserIdAndEventId(Long userId,Long eventId);
    Optional<EventMember> findByUserIdAndEventId(Long userId,Long eventId);
    void deleteByUserIdAndEventId(Long userId,Long eventId);
    List<EventMember> findAllByEventId(Long eventId);
    List<EventMember> findAllByUserId(Long userId);
}
