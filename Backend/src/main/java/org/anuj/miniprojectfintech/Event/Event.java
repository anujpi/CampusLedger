package org.anuj.miniprojectfintech.Event;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.anuj.miniprojectfintech.Club.Club;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message ="Event name is required")
    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false,updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime dueAt;
    @NotNull(message = "Event must belong to a club")
    @ManyToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name = "club_id",nullable = false)
    private Club club;
    private LocalDateTime lastRegisterAt;
    private Boolean paid = false;
    private BigDecimal amount;
    private Boolean solo = false;
    private Integer teamSize;
    @PrePersist
    protected void onCreate(){
        this.createdAt = LocalDateTime.now();
    }
}
