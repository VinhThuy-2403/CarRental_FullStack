package com.carrental.module.admin.dto;

import com.carrental.common.enums.BookingStatus;
import com.carrental.common.enums.CarStatus;
import com.carrental.common.enums.Role;
import com.carrental.common.enums.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AdminDtos {

    // ─── Dashboard ───────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardResponse {
        // Xe
        private long totalCars;
        private long pendingCars;
        private long approvedCars;
        private long rejectedCars;

        // User
        private long totalUsers;
        private long totalCustomers;
        private long totalHosts;
        private long lockedUsers;
        private long newUsersThisMonth;

        // Booking
        private long totalBookings;
        private long bookingsToday;
        private long bookingsThisWeek;
        private long bookingsThisMonth;
        private long pendingConfirmBookings;
        private long completedBookings;

        // Chart: đơn theo ngày (7 ngày gần nhất)
        private List<DailyStatDto> bookingsByDay;

        // Top xe đặt nhiều nhất
        private List<TopCarDto> topCars;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyStatDto {
        private String date;  // yyyy-MM-dd
        private long count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopCarDto {
        private Long carId;
        private String carName;
        private String imageUrl;
        private long bookingCount;
    }

    // ─── Admin: xem danh sách xe ─────────────────────────

    @Data
    public static class AdminCarSummary {
        private Long id;
        private String licensePlate;
        private String brand;
        private String model;
        private Integer year;
        private String fullName;
        private String province;
        private BigDecimal pricePerDay;
        private CarStatus status;
        private String rejectReason;
        private String primaryImageUrl;
        // Host info
        private Long hostId;
        private String hostName;
        private String hostEmail;
        private String hostPhone;
        private LocalDateTime createdAt;
    }

    // ─── Admin: từ chối xe ───────────────────────────────

    @Data
    public static class RejectCarRequest {
        @NotBlank(message = "Lý do từ chối không được để trống")
        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        private String reason;
    }

    // ─── Admin: xem danh sách user ───────────────────────

    @Data
    public static class AdminUserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String avatarUrl;
        private Role role;
        private UserStatus status;
        private LocalDateTime createdAt;
        // Stats
        private long totalBookings;    // nếu là CUSTOMER
        private long totalCars;        // nếu là HOST
    }

    // ─── Admin: lịch sử hoạt động user ──────────────────

    @Data
    public static class UserActivityResponse {
        private Long userId;
        private String fullName;
        private String email;
        private Role role;
        private UserStatus status;
        private LocalDateTime createdAt;
        // Booking history (customer)
        private List<BookingActivityDto> recentBookings;
        // Car list (host)
        private List<CarActivityDto> cars;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BookingActivityDto {
        private Long id;
        private String carName;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal totalPrice;
        private BookingStatus status;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CarActivityDto {
        private Long id;
        private String fullName;
        private String licensePlate;
        private CarStatus status;
        private long totalBookings;
        private LocalDateTime createdAt;
    }

    // ─── Admin: tất cả đơn đặt ───────────────────────────

    @Data
    public static class AdminBookingSummary {
        private Long id;
        private String carName;
        private String customerName;
        private String customerEmail;
        private String hostName;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDays;
        private BigDecimal totalPrice;
        private BookingStatus status;
        private LocalDateTime createdAt;
    }
}