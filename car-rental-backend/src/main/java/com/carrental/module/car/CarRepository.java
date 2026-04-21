package com.carrental.module.car;

import com.carrental.common.enums.CarStatus;
import com.carrental.common.enums.FuelType;
import com.carrental.common.enums.Transmission;
import com.carrental.module.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {

    boolean existsByLicensePlate(String licensePlate);

    Optional<Car> findByIdAndHost(Long id, User host);

    List<Car> findByHostOrderByCreatedAtDesc(User host);

    @Query("""
        SELECT c FROM Car c
        WHERE c.status = 'APPROVED'
        AND (:province IS NULL OR LOWER(c.province) LIKE LOWER(CONCAT('%', :province, '%')))
        AND (:minPrice IS NULL OR c.pricePerDay >= :minPrice)
        AND (:maxPrice IS NULL OR c.pricePerDay <= :maxPrice)
        AND (:seats IS NULL OR c.seats = :seats)
        AND (:transmission IS NULL OR c.transmission = :transmission)
        AND (:fuelType IS NULL OR c.fuelType = :fuelType)
        AND (:startDate IS NULL OR :endDate IS NULL OR c.id NOT IN (
            SELECT cal.car.id FROM CarCalendar cal
            WHERE cal.date BETWEEN :startDate AND :endDate
            AND cal.status IN ('BLOCKED', 'BOOKED')
        ))
        """)
    Page<Car> searchCars(
            @Param("province")     String province,
            @Param("startDate")    LocalDate startDate,
            @Param("endDate")      LocalDate endDate,
            @Param("minPrice")     BigDecimal minPrice,
            @Param("maxPrice")     BigDecimal maxPrice,
            @Param("seats")        Integer seats,
            @Param("transmission") Transmission transmission,
            @Param("fuelType")     FuelType fuelType,
            Pageable pageable);

    @Query("SELECT c FROM Car c WHERE c.status = 'APPROVED' ORDER BY c.avgRating DESC, c.totalReviews DESC")
    List<Car> findFeaturedCars(Pageable pageable);

    long countByStatus(CarStatus status);

    // ── Admin queries ────────────────────────────────────

    // Danh sách xe chờ duyệt, mới nhất trước
    Page<Car> findByStatusOrderByCreatedAtAsc(CarStatus status, Pageable pageable);

    // Admin filter xe theo status
    @Query("""
        SELECT c FROM Car c
        WHERE (:status IS NULL OR c.status = :status)
        AND (:keyword IS NULL OR
             LOWER(c.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
             LOWER(c.model) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
             LOWER(c.licensePlate) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY c.createdAt DESC
        """)
    Page<Car> findAllWithFilter(
            @Param("status")  CarStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);
}