package com.coderacer.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    private String password;

    private String oauthProvider;
    private String oauthId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private String profileImage;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
