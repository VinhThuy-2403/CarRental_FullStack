package com.carrental.module.booking.dto;

import com.carrental.common.enums.BookingStatus;
import com.carrental.common.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BookingDtos {

    // ─── Request: Tạo đơn ────────────────────────────────
    @Data
    public static class CreateBookingRequest {

        @NotNull(message = "ID xe không được để trống")
        private Long carId;

        @NotNull(message = "Ngày nhận xe không được để trống")
        private LocalDate startDate;

        @NotNull(message = "Ngày trả xe không được để trống")
        private LocalDate endDate;

        @NotBlank(message = "Họ tên người lái không được để trống")
        @Size(max = 100)
        private String driverName;

        @NotBlank(message = "CMND/CCCD không được để trống")
        @Size(min = 9, max = 12, message = "CMND/CCCD phải từ 9-12 số")
        private String driverIdCard;

        @NotBlank(message = "SĐT người lái không được để trống")
        @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$",
                 message = "Số điện thoại không hợp lệ")
        private String driverPhone;

        @NotNull(message = "Phương thức thanh toán không được để trống")
        private PaymentMethod paymentMethod;
    }

    // ─── Response: Tóm tắt đơn ──────────────────────────
    @Data
    public static class BookingSummary {
        private Long id;
        private String carName;
        private String carImageUrl;
        private String province;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDays;
        private BigDecimal totalPrice;
        private BookingStatus status;
        private PaymentMethod paymentMethod;
        private LocalDateTime createdAt;
    }

    // ─── Response: Chi tiết đơn ──────────────────────────
    @Data
    public static class BookingDetail {
        private Long id;
        // Thông tin xe
        private Long carId;
        private String carName;
        private String carImageUrl;
        private String province;
        private BigDecimal pricePerDay;
        // Thông tin đặt
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDays;
        private BigDecimal depositAmount;
        private BigDecimal totalPrice;
        // Thông tin người lái
        private String driverName;
        private String driverIdCard;
        private String driverPhone;
        // Thanh toán & trạng thái
        private PaymentMethod paymentMethod;
        private BookingStatus status;
        private String cancelReason;
        private LocalDateTime confirmedAt;
        private LocalDateTime confirmDeadline;
        private LocalDateTime createdAt;
        // Thông tin host (cho customer xem)
        private HostInfo host;
        // Thông tin customer (cho host xem)
        private CustomerInfo customer;
    }

    @Data
    public static class HostInfo {
        private Long id;
        private String fullName;
        private String phone;
        private String avatarUrl;
    }

    @Data
    public static class CustomerInfo {
        private Long id;
        private String fullName;
        private String phone;
        private String avatarUrl;
    }

    // ─── Request: Từ chối đơn ────────────────────────────
    @Data
    public static class RejectBookingRequest {
        @NotBlank(message = "Lý do từ chối không được để trống")
        @Size(max = 500)
        private String reason;
    }

    // ─── Request: Hủy đơn (Customer) ────────────────────
    @Data
    public static class CancelBookingRequest {
        @Size(max = 500)
        private String reason;
    }
}