package com.carrental.module.booking;

import com.carrental.common.enums.BookingStatus;
import com.carrental.module.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Customer: xem đơn của mình
    Page<Booking> findByCustomerOrderByCreatedAtDesc(User customer, Pageable pageable);

    // Host: xem đơn chờ xác nhận của xe mình
    @Query("""
        SELECT b FROM Booking b
        WHERE b.car.host = :host
        AND b.status IN :statuses
        ORDER BY b.createdAt DESC
        """)
    List<Booking> findByHostAndStatusIn(
            @Param("host") User host,
            @Param("statuses") List<BookingStatus> statuses);

    // Kiểm tra xe đã được đặt trong khoảng ngày chưa
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.car.id = :carId
        AND b.status IN ('PENDING_CONFIRM', 'CONFIRMED', 'IN_PROGRESS')
        AND b.startDate <= :endDate
        AND b.endDate   >= :startDate
        """)
    boolean existsActiveBookingInRange(
            @Param("carId")     Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate);

    // Lấy đơn theo id + kiểm tra quyền (customer hoặc host của xe)
    @Query("""
        SELECT b FROM Booking b
        WHERE b.id = :id
        AND (b.customer = :user OR b.car.host = :user)
        """)
    Optional<Booking> findByIdAndUser(
            @Param("id") Long id,
            @Param("user") User user);

    // Admin: đếm theo status
    long countByStatus(BookingStatus status);

    // Booking quá deadline chưa được xác nhận → tự động hủy
    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'PENDING_CONFIRM'
        AND b.confirmDeadline < CURRENT_TIMESTAMP
        """)
    List<Booking> findExpiredPendingConfirm();
}