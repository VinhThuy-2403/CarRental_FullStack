package com.carrental.module.car.dto;

import com.carrental.common.enums.CalendarStatus;
import com.carrental.common.enums.CarStatus;
import com.carrental.common.enums.FuelType;
import com.carrental.common.enums.Transmission;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CarDtos {

    // ─── Request: Đăng / Sửa xe ─────────────────────────
    @Data
    public static class CarRequest {

        @NotBlank(message = "Biển số không được để trống")
        @Size(max = 20, message = "Biển số tối đa 20 ký tự")
        private String licensePlate;

        @NotBlank(message = "Hãng xe không được để trống")
        private String brand;

        @NotBlank(message = "Model không được để trống")
        private String model;

        @NotNull(message = "Năm sản xuất không được để trống")
        @Min(value = 2000, message = "Năm sản xuất từ 2000 trở lên")
        @Max(value = 2030, message = "Năm sản xuất không hợp lệ")
        private Integer year;

        @NotNull(message = "Số chỗ không được để trống")
        @Min(value = 2, message = "Tối thiểu 2 chỗ")
        @Max(value = 16, message = "Tối đa 16 chỗ")
        private Integer seats;

        @NotNull(message = "Loại nhiên liệu không được để trống")
        private FuelType fuelType;

        @NotNull(message = "Hộp số không được để trống")
        private Transmission transmission;

        @NotNull(message = "Giá thuê không được để trống")
        @DecimalMin(value = "100000", message = "Giá thuê tối thiểu 100.000đ")
        private BigDecimal pricePerDay;

        @NotNull(message = "Tiền đặt cọc không được để trống")
        @DecimalMin(value = "0", message = "Tiền đặt cọc không âm")
        private BigDecimal deposit;

        private Integer kmLimitPerDay;

        @NotBlank(message = "Tỉnh/thành không được để trống")
        private String province;

        private String district;

        @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
        private String description;

        private List<String> features;
    }

    // ─── Response: Tóm tắt xe (danh sách) ───────────────
    @Data
    public static class CarSummary {
        private Long id;
        private String brand;
        private String model;
        private Integer year;
        private String fullName;
        private Integer seats;
        private FuelType fuelType;
        private Transmission transmission;
        private BigDecimal pricePerDay;
        private BigDecimal deposit;
        private String province;
        private String district;
        private String primaryImageUrl;
        private BigDecimal avgRating;
        private Integer totalReviews;
        private CarStatus status;
        private LocalDateTime createdAt;
    }

    // ─── Response: Chi tiết xe ───────────────────────────
    @Data
    public static class CarDetail {
        private Long id;
        private String brand;
        private String model;
        private Integer year;
        private String fullName;
        private Integer seats;
        private FuelType fuelType;
        private Transmission transmission;
        private BigDecimal pricePerDay;
        private BigDecimal deposit;
        private Integer kmLimitPerDay;
        private String province;
        private String district;
        private String description;
        private List<String> features;
        private List<ImageDto> images;
        private BigDecimal avgRating;
        private Integer totalReviews;
        private CarStatus status;
        private String rejectReason;
        private HostInfo host;
        private LocalDateTime createdAt;
    }

    @Data
    public static class ImageDto {
        private Long id;
        private String url;
        private boolean isPrimary;
        private int displayOrder;
    }

    @Data
    public static class HostInfo {
        private Long id;
        private String fullName;
        private String avatarUrl;
        private double avgRating;
        private int totalCompletedBookings;
    }

    // ─── Request: Tìm kiếm xe ────────────────────────────
    @Data
    public static class CarSearchRequest {
        private String province;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private Integer seats;
        private Transmission transmission;
        private FuelType fuelType;
        private String sortBy; // price_asc, price_desc, rating, newest
    }

    // ─── Response: Lịch xe ───────────────────────────────
    @Data
    public static class CalendarDay {
        private LocalDate date;
        private CalendarStatus status;
        private Long bookingId;
    }

    // ─── Request: Chặn ngày ──────────────────────────────
    @Data
    public static class BlockDateRequest {
        @NotNull(message = "Ngày bắt đầu không được để trống")
        private LocalDate startDate;

        @NotNull(message = "Ngày kết thúc không được để trống")
        private LocalDate endDate;
    }

    // ─── Request: Đổi trạng thái xe (Host ẩn/hiện) ──────
    @Data
    public static class UpdateStatusRequest {
        @NotNull
        private CarStatus status; // INACTIVE hoặc APPROVED
    }
}