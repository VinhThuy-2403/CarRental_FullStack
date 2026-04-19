package com.carrental.module.car;

import com.carrental.common.enums.CalendarStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarCalendarRepository extends JpaRepository<CarCalendar, Long> {

    Optional<CarCalendar> findByCarIdAndDate(Long carId, LocalDate date);

    List<CarCalendar> findByCarIdAndDateBetweenOrderByDate(
            Long carId, LocalDate start, LocalDate end);

    boolean existsByCarIdAndDateAndStatusIn(
            Long carId, LocalDate date, List<CalendarStatus> statuses);

    @Modifying
    @Query("DELETE FROM CarCalendar c WHERE c.car.id = :carId AND c.date BETWEEN :start AND :end AND c.status = 'BLOCKED'")
    void deleteBlockedByCarAndDateRange(
            @Param("carId") Long carId,
            @Param("start") LocalDate start,
            @Param("end")   LocalDate end);
}