package com.carrental.module.review.dto;

import com.carrental.module.review.Review;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data 
@Builder
public class ReviewResponse {
    private Long id;
    private Long bookingId;
    private Long carId;
    private String carName;
    private Long customerId;
    private String customerName;
    private String customerAvatar;
    private Integer rating;
    private String comment;
    private String hostReply;
    private LocalDateTime hostReplyAt;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .bookingId(r.getBooking().getId())
                .carId(r.getCar().getId())
                .carName(r.getCar().getBrand() + " " + r.getCar().getModel() + " " + r.getCar().getYear())
                .customerId(r.getCustomer().getId())
                .customerName(r.getCustomer().getFullName())
                .customerAvatar(r.getCustomer().getAvatarUrl())
                .rating(r.getRating())
                .comment(r.getComment())
                .hostReply(r.getHostReply())
                .hostReplyAt(r.getHostReplyAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}