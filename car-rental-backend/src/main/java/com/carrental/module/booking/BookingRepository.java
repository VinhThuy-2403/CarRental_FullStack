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
import java.time.LocalDateTime;
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
            @Param("host")     User host,
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

    // Lấy đơn theo id + kiểm tra quyền
    @Query("""
        SELECT b FROM Booking b
        WHERE b.id = :id
        AND (b.customer = :user OR b.car.host = :user)
        """)
    Optional<Booking> findByIdAndUser(
            @Param("id")   Long id,
            @Param("user") User user);

    // Admin: đếm theo status
    long countByStatus(BookingStatus status);

    // Booking quá deadline chưa xác nhận
    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'PENDING_CONFIRM'
        AND b.confirmDeadline < CURRENT_TIMESTAMP
        """)
    List<Booking> findExpiredPendingConfirm();

    // ── Admin: thống kê ──────────────────────────────────

    // Đếm đơn trong khoảng thời gian
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // Đếm đơn COMPLETED trong khoảng (để tính doanh thu)
    long countByStatusAndCreatedAtBetween(
            BookingStatus status, LocalDateTime from, LocalDateTime to);

    // Admin: tất cả đơn với filter
    @Query("""
        SELECT b FROM Booking b
        WHERE (:status IS NULL OR b.status = :status)
        AND (:from IS NULL OR b.createdAt >= :from)
        AND (:to   IS NULL OR b.createdAt <= :to)
        ORDER BY b.createdAt DESC
        """)
    Page<Booking> findAllWithFilter(
            @Param("status") BookingStatus status,
            @Param("from")   LocalDateTime from,
            @Param("to")     LocalDateTime to,
            Pageable pageable);

    // Top xe được đặt nhiều nhất
    @Query("""
        SELECT b.car.id, b.car.brand, b.car.model, b.car.year,
               COUNT(b) as bookingCount
        FROM Booking b
        WHERE b.status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
        GROUP BY b.car.id, b.car.brand, b.car.model, b.car.year
        ORDER BY bookingCount DESC
        """)
    List<Object[]> findTopBookedCars(Pageable pageable);

    // Đơn theo từng ngày trong khoảng (cho chart)
    @Query("""
        SELECT CAST(b.createdAt AS DATE), COUNT(b)
        FROM Booking b
        WHERE b.createdAt BETWEEN :from AND :to
        GROUP BY CAST(b.createdAt AS DATE)
        ORDER BY CAST(b.createdAt AS DATE)
        """)
    List<Object[]> countBookingsByDay(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to);
}