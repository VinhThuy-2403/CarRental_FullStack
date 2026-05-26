package com.carrental.module.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** Kiểm tra đơn đã được đánh giá chưa (unique constraint) */
    boolean existsByBookingId(Long bookingId);

    /** Lấy tất cả đánh giá của một xe, mới nhất trước */
    Page<Review> findByCarIdOrderByCreatedAtDesc(Long carId, Pageable pageable);

    /** Tính điểm trung bình của xe */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.car.id = :carId")
    Optional<Double> findAvgRatingByCarId(@Param("carId") Long carId);

    /** Đếm số lượng đánh giá của xe */
    long countByCarId(Long carId);

    /** Điểm trung bình của host (tính qua tất cả xe của host) */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.car.host.id = :hostId")
    Optional<Double> findAvgRatingByHostId(@Param("hostId") Long hostId);

    /** Số lượng đánh giá của host */
    @Query("SELECT COUNT(r) FROM Review r WHERE r.car.host.id = :hostId")
    long countByHostId(@Param("hostId") Long hostId);

    /** Tìm review theo bookingId */
    Optional<Review> findByBookingId(Long bookingId);
}
