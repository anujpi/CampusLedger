package org.anuj.miniprojectfintech.Event;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.anuj.miniprojectfintech.Club.Club;
import org.anuj.miniprojectfintech.User.User;

import java.time.LocalDateTime;
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_event_member_user_event",columnNames = {"user_id","event_id"}))
public class EventMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id",nullable = false)
    private User user;
    @ManyToOne(optional = false)
    @JoinColumn(name = "club_id",nullable = false)
    private Club club;
    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id",nullable = false)
    private Event event;
    @Column(nullable = false)
    private Boolean paymentDone = false;
    private String paymentTxnId;
    @Column(nullable = false,updatable = false)
    private LocalDateTime registeredAt;
    private String teamName;
    @Column(columnDefinition = "TEXT")
    private String teamDetails;

    @PrePersist
    protected void onCreate(){
        this.registeredAt = LocalDateTime.now();
    }
}
