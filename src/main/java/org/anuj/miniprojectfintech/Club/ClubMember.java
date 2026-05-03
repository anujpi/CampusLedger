package org.anuj.miniprojectfintech.Club;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.anuj.miniprojectfintech.User.User;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "club_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"club_id", "user_id"})
)
public class ClubMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "club_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Club club;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false)
    private LocalDate joinedAt;
    private LocalDate leftAt;
    private MemberShipStatus status;
    private ClubRole role;
    @PrePersist
    protected void onCreate(){
        this.joinedAt = LocalDate.now();
    }
}
