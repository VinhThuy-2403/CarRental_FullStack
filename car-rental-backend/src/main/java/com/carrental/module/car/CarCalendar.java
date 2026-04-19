package com.carrental.module.car;

import com.carrental.common.enums.CalendarStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
    name = "car_calendars",
    uniqueConstraints = @UniqueConstraint(columnNames = {"car_id", "date"})
)
@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CalendarStatus status = CalendarStatus.AVAILABLE;

    // Nếu BOOKED, lưu booking_id để tra cứu
    private Long bookingId;
}