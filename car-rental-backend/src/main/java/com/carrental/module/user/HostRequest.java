package com.carrental.module.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "host_requests")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HostRequestStatus status = HostRequestStatus.PENDING;

    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    private LocalDateTime processedAt;

    public enum HostRequestStatus {
        PENDING, APPROVED, REJECTED
    }
}
