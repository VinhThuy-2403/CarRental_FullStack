package com.carrental.module.payment;

import com.carrental.common.enums.PaymentMethod;
import com.carrental.common.enums.PaymentStatus;
import com.carrental.module.booking.Booking;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // Mã giao dịch từ cổng thanh toán (VNPay txnRef, MoMo orderId)
    @Column(unique = true, length = 100)
    private String transactionId;

    // Mã giao dịch phía cổng thanh toán trả về
    @Column(length = 100)
    private String gatewayTransactionId;

    @Column(columnDefinition = "TEXT")
    private String rawResponse; // Lưu toàn bộ response từ cổng thanh toán

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    private LocalDateTime paidAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}