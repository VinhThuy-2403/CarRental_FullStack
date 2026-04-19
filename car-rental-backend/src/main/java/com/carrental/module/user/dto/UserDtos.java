package com.carrental.module.user.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

public class UserDtos {

    @Data
    public static class UserProfileResponse {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String avatarUrl;
        private String role;
        private String status;
        private String address;
    }

    @Data
    public static class UpdateProfileRequest {
        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 100, message = "Họ tên từ 2–100 ký tự")
        private String fullName;

        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ")
        private String phone;
        private String address;
    }

    @Data
    public static class PublicHostProfile {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private int totalCompletedBookings;
        private double avgRating;
    }
}