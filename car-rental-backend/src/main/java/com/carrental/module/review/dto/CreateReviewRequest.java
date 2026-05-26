package com.carrental.module.review.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateReviewRequest {
    @NotNull(message = "bookingId không được để trống")
    private Long bookingId;

    @NotNull(message = "Vui lòng chọn số sao")
    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    private Integer rating;

    @Size(max = 500, message = "Nhận xét tối đa 500 ký tự")
    private String comment;
}