package com.carrental.module.review;

import com.carrental.module.booking.Booking;
import com.carrental.module.car.Car;
import com.carrental.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_review_booking",
        columnNames = "booking_id"           // Mỗi đơn chỉ được đánh giá 1 lần
    )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Đơn thuê — bắt buộc COMPLETED mới được review
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    // Người đánh giá (Customer)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    // Xe được đánh giá (denormalize để query nhanh)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    // Thang điểm 1–5
    @Column(nullable = false)
    private Integer rating;

    // Nhận xét văn bản, tối đa 500 ký tự
    @Column(length = 500)
    private String comment;

    // Host phản hồi đánh giá
    @Column(name = "host_reply", length = 500)
    private String hostReply;

    @Column(name = "host_reply_at")
    private LocalDateTime hostReplyAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
