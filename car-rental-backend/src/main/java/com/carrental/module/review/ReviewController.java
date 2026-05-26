package com.carrental.module.review;

import com.carrental.common.ApiResponse;
import com.carrental.common.PageResponse;
import com.carrental.module.review.dto.CreateReviewRequest;
import com.carrental.module.review.dto.ReplyReviewRequest;
import com.carrental.module.review.dto.ReviewResponse;
import com.carrental.module.user.User; // Đã sửa lại đường dẫn import đúng
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * POST /api/v1/reviews
     * Customer tạo đánh giá sau khi chuyến COMPLETED
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @AuthenticationPrincipal User principal, // Đã thay UserDetailsImpl thành User
            @Valid @RequestBody CreateReviewRequest request) {

        ReviewResponse response = reviewService.createReview(principal.getId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Đánh giá thành công"));
    }

    /**
     * GET /api/v1/reviews/car/{carId}?page=0&size=10
     * Public: Danh sách đánh giá của xe
     */
    @GetMapping("/car/{carId}")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getCarReviews(
            @PathVariable Long carId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getCarReviews(carId, pageable)));
    }

    /**
     * GET /api/v1/reviews/booking/{bookingId}
     * Lấy review theo bookingId (Customer xem lại đánh giá của mình)
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','HOST')")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewByBooking(
            @PathVariable Long bookingId) {

        ReviewResponse review = reviewService.getReviewByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(review));
    }

    /**
     * PATCH /api/v1/reviews/{id}/reply
     * Host phản hồi đánh giá
     */
    @PatchMapping("/{id}/reply")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<ReviewResponse>> replyReview(
            @AuthenticationPrincipal User principal, // Đã thay UserDetailsImpl thành User
            @PathVariable Long id,
            @Valid @RequestBody ReplyReviewRequest request) {

        ReviewResponse response = reviewService.replyReview(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Phản hồi thành công"));
    }

    /**
     * DELETE /api/v1/reviews/{id}
     * Admin xóa đánh giá vi phạm chính sách
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã xóa đánh giá"));
    }
}