package org.anuj.miniprojectfintech.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String fullName;
    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;
    @Column(nullable = false,unique = true)
    private String email;
    @Enumerated(EnumType.STRING)
    private Role role;
    private String year;
    private Boolean active;
    private Boolean mustChangePassword;
    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;
    private LocalDate joinInDate;
}
