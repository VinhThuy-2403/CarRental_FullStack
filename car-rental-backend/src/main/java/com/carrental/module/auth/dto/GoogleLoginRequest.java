package com.carrental.module.auth.dto;

import com.carrental.common.enums.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "idToken không được để trống")
    private String idToken;

    // Chỉ cần khi tạo user mới (needsRoleSelection flow)
    private Role role;
}
