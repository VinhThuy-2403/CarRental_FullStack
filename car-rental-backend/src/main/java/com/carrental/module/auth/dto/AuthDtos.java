package com.carrental.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

// ─── Login ────────────────────────────────────────────
public class AuthDtos {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        private String email;

        @NotBlank(message = "Mật khẩu không được để trống")
        private String password;
    }

    @Data
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private UserInfo user;

        @Data
        public static class UserInfo {
            private Long id;
            private String fullName;
            private String email;
            private String role;
            private String avatarUrl;
        }
    }

    @Data
    public static class TokenRefreshRequest {
        @NotBlank(message = "Refresh token không được để trống")
        private String refreshToken;
    }

    @Data
    public static class TokenRefreshResponse {
        private String accessToken;
        private String refreshToken;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank
        @Email(message = "Email không hợp lệ")
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Token không được để trống")
        private String token;

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Mật khẩu tối thiểu 8 ký tự, có ít nhất 1 chữ hoa và 1 số"
        )
        private String newPassword;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        private String currentPassword;

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Mật khẩu tối thiểu 8 ký tự, có ít nhất 1 chữ hoa và 1 số"
        )
        private String newPassword;
    }
}