package com.carrental.module.user;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HostRequestDto {
    private Long          id;
    private Long          userId;
    private String        userFullName;
    private String        userEmail;
    private String        userAvatarUrl;
    private String        status;
    private String        adminNote;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    public static HostRequestDto from(HostRequest r) {
        HostRequestDto dto = new HostRequestDto();
        dto.setId(r.getId());
        dto.setUserId(r.getUser().getId());
        dto.setUserFullName(r.getUser().getFullName());
        dto.setUserEmail(r.getUser().getEmail());
        dto.setUserAvatarUrl(r.getUser().getAvatarUrl());
        dto.setStatus(r.getStatus().name());
        dto.setAdminNote(r.getAdminNote());
        dto.setRequestedAt(r.getRequestedAt());
        dto.setProcessedAt(r.getProcessedAt());
        return dto;
    }
}
