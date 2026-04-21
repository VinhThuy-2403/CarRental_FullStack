package com.carrental.module.booking;

import com.carrental.common.enums.BookingStatus;
import com.carrental.common.enums.PaymentMethod;
import com.carrental.module.car.Car;
import com.carrental.module.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer totalDays;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerDay;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    // Thông tin người lái xe
    @Column(nullable = false, length = 100)
    private String driverName;

    @Column(nullable = false, length = 20)
    private String driverIdCard;  // CMND/CCCD

    @Column(nullable = false, length = 15)
    private String driverPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING_PAYMENT;

    @Column(columnDefinition = "TEXT")
    private String cancelReason;

    // Thời điểm host xác nhận/từ chối
    private LocalDateTime confirmedAt;

    // Deadline host phải xác nhận (2 giờ sau khi thanh toán)
    private LocalDateTime confirmDeadline;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}