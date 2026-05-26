package com.carrental.module.review;

import com.carrental.common.PageResponse;
import com.carrental.common.enums.BookingStatus;
import com.carrental.common.enums.NotificationType;
import com.carrental.module.booking.Booking;
import com.carrental.module.booking.BookingRepository;
import com.carrental.module.car.Car;
import com.carrental.module.car.CarRepository;
import com.carrental.module.notification.NotificationService;
import com.carrental.module.review.dto.CreateReviewRequest;
import com.carrental.module.review.dto.ReplyReviewRequest;
import com.carrental.module.review.dto.ReviewResponse;
import com.carrental.module.user.User;
import com.carrental.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository    reviewRepository;
    private final BookingRepository   bookingRepository;
    private final UserRepository      userRepository;
    private final NotificationService notificationService;
    private final CarRepository       carRepository;

    // ─── Customer: Tạo đánh giá ─────────────────────────────────────────────

    @Transactional
    public ReviewResponse createReview(Long customerId, CreateReviewRequest req) {

        // 1. Lấy đơn đặt xe
        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt xe"));

        // 2. Kiểm tra quyền sở hữu
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền đánh giá đơn này");
        }

        // 3. Chỉ đánh giá khi đơn COMPLETED
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể đánh giá sau khi chuyến đi hoàn thành");
        }

        // 4. Mỗi đơn chỉ được đánh giá 1 lần
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Đơn này đã được đánh giá");
        }

        // 5. Tạo review
        User customer = userRepository.getReferenceById(customerId);
        Review review = Review.builder()
                .booking(booking)
                .customer(customer)
                .car(booking.getCar())
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        reviewRepository.save(review);

        Car car = booking.getCar();
        long totalReviews = reviewRepository.countByCarId(car.getId());
        double avgRating = reviewRepository.findAvgRatingByCarId(car.getId()).orElse(0.0);
        
        car.setTotalReviews((int) totalReviews);
        car.setAvgRating(java.math.BigDecimal.valueOf(avgRating));
        carRepository.save(car);

        // 6. Thông báo cho Host biết có đánh giá mới
        notificationService.createNotification(
                booking.getCar().getHost().getId(),
                NotificationType.NEW_REVIEW,
                "Đánh giá mới cho xe của bạn",
                customer.getFullName() + " vừa đánh giá "
                + review.getRating() + "⭐ cho xe "
                + booking.getCar().getBrand() + " " + booking.getCar().getModel(),
                review.getId()
        );

        return ReviewResponse.from(review);
    }

    // ─── Public: Lấy danh sách đánh giá của xe ──────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getCarReviews(Long carId, Pageable pageable) {
        Page<ReviewResponse> page = reviewRepository
                .findByCarIdOrderByCreatedAtDesc(carId, pageable)
                .map(ReviewResponse::from);
        return PageResponse.of(page);
    }

    // ─── Public: Lấy điểm trung bình của xe ─────────────────────────────────

    @Transactional(readOnly = true)
    public double getCarAvgRating(Long carId) {
        return reviewRepository.findAvgRatingByCarId(carId).orElse(0.0);
    }

    @Transactional(readOnly = true)
    public long getCarReviewCount(Long carId) {
        return reviewRepository.countByCarId(carId);
    }

    // ─── Public: Điểm trung bình của Host ───────────────────────────────────

    @Transactional(readOnly = true)
    public double getHostAvgRating(Long hostId) {
        return reviewRepository.findAvgRatingByHostId(hostId).orElse(0.0);
    }

    @Transactional(readOnly = true)
    public long getHostReviewCount(Long hostId) {
        return reviewRepository.countByHostId(hostId);
    }

    // ─── Host: Phản hồi đánh giá ────────────────────────────────────────────

    @Transactional
    public ReviewResponse replyReview(Long hostId, Long reviewId, ReplyReviewRequest req) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));

        // Chỉ Host của xe mới được phản hồi
        if (!review.getCar().getHost().getId().equals(hostId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền phản hồi đánh giá này");
        }

        // Không cho phép thay đổi phản hồi sau khi đã reply
        if (review.getHostReply() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bạn đã phản hồi đánh giá này rồi");
        }

        review.setHostReply(req.getReply());
        review.setHostReplyAt(java.time.LocalDateTime.now());
        reviewRepository.save(review);

        return ReviewResponse.from(review);
    }

    // ─── Admin: Xóa đánh giá vi phạm ────────────────────────────────────────

    @Transactional
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá");
        }
        reviewRepository.deleteById(reviewId);
    }

    // ─── Lấy review theo bookingId (cho BookingDetailPage) ──────────────────

    @Transactional(readOnly = true)
    public ReviewResponse getReviewByBookingId(Long bookingId) {
        return reviewRepository.findByBookingId(bookingId)
                .map(ReviewResponse::from)
                .orElse(null);
    }
}
