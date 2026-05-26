package com.carrental.module.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReplyReviewRequest {
    @NotBlank(message = "Nội dung phản hồi không được để trống")
    @Size(max = 500, message = "Phản hồi tối đa 500 ký tự")
    private String reply;
}