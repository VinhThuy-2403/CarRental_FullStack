package com.carrental.module.admin;

import com.carrental.common.enums.*;
import com.carrental.common.exception.AppException;
import com.carrental.module.admin.dto.AdminDtos.*;
import com.carrental.module.booking.Booking;
import com.carrental.module.booking.BookingRepository;
import com.carrental.module.car.Car;
import com.carrental.module.car.CarRepository;
import com.carrental.module.car.CarService;
import com.carrental.module.car.dto.CarDtos.CarDetail;
import com.carrental.module.user.User;
import com.carrental.module.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final CarService carService;

    // ─── Dashboard ───────────────────────────────────────

    public DashboardResponse getDashboard() {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime startDay  = now.toLocalDate().atStartOfDay();
        LocalDateTime startWeek = now.toLocalDate()
                .with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime startMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

        // ── Xe ──────────────────────────────────────────
        long totalCars    = carRepository.count();
        long pendingCars  = carRepository.countByStatus(CarStatus.PENDING);
        long approvedCars = carRepository.countByStatus(CarStatus.APPROVED);
        long rejectedCars = carRepository.countByStatus(CarStatus.REJECTED);

        // ── User ────────────────────────────────────────
        long totalUsers       = userRepository.count();
        long totalCustomers   = userRepository.countByRole(Role.CUSTOMER);
        long totalHosts       = userRepository.countByRole(Role.HOST);
        long lockedUsers      = userRepository.countByStatus(UserStatus.LOCKED);
        long newUsersThisMonth = userRepository.countByCreatedAtBetween(startMonth, now);

        // ── Booking ─────────────────────────────────────
        long totalBookings         = bookingRepository.count();
        long bookingsToday         = bookingRepository.countByCreatedAtBetween(startDay, now);
        long bookingsThisWeek      = bookingRepository.countByCreatedAtBetween(startWeek, now);
        long bookingsThisMonth     = bookingRepository.countByCreatedAtBetween(startMonth, now);
        long pendingConfirmBookings = bookingRepository.countByStatus(BookingStatus.PENDING_CONFIRM);
        long completedBookings     = bookingRepository.countByStatus(BookingStatus.COMPLETED);

        // ── Chart: 7 ngày gần nhất ──────────────────────
        LocalDateTime sevenDaysAgo = now.minusDays(7).toLocalDate().atStartOfDay();
        List<Object[]> rawDailyStats = bookingRepository.countBookingsByDay(sevenDaysAgo, now);

        // Tạo map date → count, điền 0 cho ngày không có đơn
        Map<String, Long> dailyMap = rawDailyStats.stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString().substring(0, 10),
                        row -> ((Number) row[1]).longValue()
                ));

        List<DailyStatDto> bookingsByDay = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String date = now.minusDays(i).toLocalDate()
                    .format(DateTimeFormatter.ISO_DATE);
            bookingsByDay.add(DailyStatDto.builder()
                    .date(date)
                    .count(dailyMap.getOrDefault(date, 0L))
                    .build());
        }

        // ── Top xe ──────────────────────────────────────
        List<Object[]> topRaw = bookingRepository.findTopBookedCars(PageRequest.of(0, 5));
        List<TopCarDto> topCars = topRaw.stream().map(row -> {
            Long carId = ((Number) row[0]).longValue();
            Car car = carRepository.findById(carId).orElse(null);
            return TopCarDto.builder()
                    .carId(carId)
                    .carName(row[1] + " " + row[2] + " " + row[3])
                    .imageUrl(car != null ? car.getPrimaryImageUrl() : null)
                    .bookingCount(((Number) row[4]).longValue())
                    .build();
        }).collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalCars(totalCars)
                .pendingCars(pendingCars)
                .approvedCars(approvedCars)
                .rejectedCars(rejectedCars)
                .totalUsers(totalUsers)
                .totalCustomers(totalCustomers)
                .totalHosts(totalHosts)
                .lockedUsers(lockedUsers)
                .newUsersThisMonth(newUsersThisMonth)
                .totalBookings(totalBookings)
                .bookingsToday(bookingsToday)
                .bookingsThisWeek(bookingsThisWeek)
                .bookingsThisMonth(bookingsThisMonth)
                .pendingConfirmBookings(pendingConfirmBookings)
                .completedBookings(completedBookings)
                .bookingsByDay(bookingsByDay)
                .topCars(topCars)
                .build();
    }

    // ─── Duyệt xe ────────────────────────────────────────

    public Page<AdminCarSummary> getPendingCars(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return carRepository.findByStatusOrderByCreatedAtAsc(CarStatus.PENDING, pageable)
                .map(this::toAdminCarSummary);
    }

    public CarDetail getCarDetailForAdmin(Long carId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));
        return carService.toDetail(car);
    }

    public Page<AdminCarSummary> getAllCars(CarStatus status, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return carRepository.findAllWithFilter(status, keyword, pageable)
                .map(this::toAdminCarSummary);
    }

    @Transactional
    public void approveCar(Long carId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        if (car.getStatus() != CarStatus.PENDING) {
            throw AppException.badRequest("Xe này không ở trạng thái chờ duyệt");
        }

        car.setStatus(CarStatus.APPROVED);
        car.setRejectReason(null);
        carRepository.save(car);

        log.info("Admin approved car {}: {}", carId, car.getLicensePlate());
        // TODO: gửi notification cho host
    }

    @Transactional
    public void rejectCar(Long carId, String reason) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        if (car.getStatus() != CarStatus.PENDING) {
            throw AppException.badRequest("Xe này không ở trạng thái chờ duyệt");
        }

        car.setStatus(CarStatus.REJECTED);
        car.setRejectReason(reason);
        carRepository.save(car);

        log.info("Admin rejected car {}: {} — reason: {}", carId, car.getLicensePlate(), reason);
        // TODO: gửi notification cho host
    }

    // ─── Quản lý User ────────────────────────────────────

    public Page<AdminUserSummary> getAllUsers(
            Role role, UserStatus status, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findAllWithFilter(role, status, keyword, pageable)
                .map(this::toAdminUserSummary);
    }

    public UserActivityResponse getUserActivity(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));

        UserActivityResponse res = new UserActivityResponse();
        res.setUserId(user.getId());
        res.setFullName(user.getFullName());
        res.setEmail(user.getEmail());
        res.setRole(user.getRole());
        res.setStatus(user.getStatus());
        res.setCreatedAt(user.getCreatedAt());

        if (user.getRole() == Role.CUSTOMER) {
            // Lịch sử đặt xe gần nhất (10 đơn)
            Page<Booking> bookings = bookingRepository
                    .findByCustomerOrderByCreatedAtDesc(user, PageRequest.of(0, 10));
            res.setRecentBookings(bookings.getContent().stream()
                    .map(b -> BookingActivityDto.builder()
                            .id(b.getId())
                            .carName(b.getCar().getFullName())
                            .startDate(b.getStartDate())
                            .endDate(b.getEndDate())
                            .totalPrice(b.getTotalPrice())
                            .status(b.getStatus())
                            .createdAt(b.getCreatedAt())
                            .build())
                    .collect(Collectors.toList()));

        } else if (user.getRole() == Role.HOST) {
            // Danh sách xe + số đơn mỗi xe
            List<Car> cars = carRepository.findByHostOrderByCreatedAtDesc(user);
            res.setCars(cars.stream()
                    .map(c -> CarActivityDto.builder()
                            .id(c.getId())
                            .fullName(c.getFullName())
                            .licensePlate(c.getLicensePlate())
                            .status(c.getStatus())
                            .totalBookings(
                                bookingRepository.countByStatus(BookingStatus.COMPLETED)) // tạm, phase sau refine
                            .createdAt(c.getCreatedAt())
                            .build())
                    .collect(Collectors.toList()));
        }

        return res;
    }

    @Transactional
    public void lockUser(Long userId) {
        User user = getUserForAdmin(userId);
        if (user.getStatus() == UserStatus.LOCKED) {
            throw AppException.badRequest("Tài khoản đã bị khóa rồi");
        }
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        log.info("Admin locked user {}", userId);
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = getUserForAdmin(userId);
        if (user.getStatus() != UserStatus.LOCKED) {
            throw AppException.badRequest("Tài khoản không ở trạng thái bị khóa");
        }
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        log.info("Admin unlocked user {}", userId);
    }

    // ─── Quản lý Booking ─────────────────────────────────

    public Page<AdminBookingSummary> getAllBookings(
            BookingStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return bookingRepository.findAllWithFilter(status, null, null, pageable)
                .map(this::toAdminBookingSummary);
    }

    // ─── Private helpers ─────────────────────────────────

    private User getUserForAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng"));
        if (user.getRole() == Role.ADMIN) {
            throw AppException.forbidden("Không thể thao tác với tài khoản Admin");
        }
        return user;
    }

    private AdminCarSummary toAdminCarSummary(Car car) {
        AdminCarSummary s = new AdminCarSummary();
        s.setId(car.getId());
        s.setLicensePlate(car.getLicensePlate());
        s.setBrand(car.getBrand());
        s.setModel(car.getModel());
        s.setYear(car.getYear());
        s.setFullName(car.getFullName());
        s.setProvince(car.getProvince());
        s.setPricePerDay(car.getPricePerDay());
        s.setStatus(car.getStatus());
        s.setRejectReason(car.getRejectReason());
        s.setPrimaryImageUrl(car.getPrimaryImageUrl());
        s.setCreatedAt(car.getCreatedAt());
        // Host info
        User host = car.getHost();
        s.setHostId(host.getId());
        s.setHostName(host.getFullName());
        s.setHostEmail(host.getEmail());
        s.setHostPhone(host.getPhone());
        return s;
    }

    private AdminUserSummary toAdminUserSummary(User user) {
        AdminUserSummary s = new AdminUserSummary();
        s.setId(user.getId());
        s.setFullName(user.getFullName());
        s.setEmail(user.getEmail());
        s.setPhone(user.getPhone());
        s.setAvatarUrl(user.getAvatarUrl());
        s.setRole(user.getRole());
        s.setStatus(user.getStatus());
        s.setCreatedAt(user.getCreatedAt());
        return s;
    }

    private AdminBookingSummary toAdminBookingSummary(Booking b) {
        AdminBookingSummary s = new AdminBookingSummary();
        s.setId(b.getId());
        s.setCarName(b.getCar().getFullName());
        s.setCustomerName(b.getCustomer().getFullName());
        s.setCustomerEmail(b.getCustomer().getEmail());
        s.setHostName(b.getCar().getHost().getFullName());
        s.setStartDate(b.getStartDate());
        s.setEndDate(b.getEndDate());
        s.setTotalDays(b.getTotalDays());
        s.setTotalPrice(b.getTotalPrice());
        s.setStatus(b.getStatus());
        s.setCreatedAt(b.getCreatedAt());
        return s;
    }
}