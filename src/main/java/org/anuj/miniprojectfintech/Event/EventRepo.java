package org.anuj.miniprojectfintech.Event;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepo extends JpaRepository<Event, Long> {
    Optional<Event> findByIdAndClub_id(Long eventId,Long clubId);
    List<Event> findAllByClub_IdOrderByCreatedAtDesc(Long clubId);
    List<Event> findAllByClub_IdAndDueAtAfterOrderByDueAtAsc(Long clubId, LocalDateTime now);
}
