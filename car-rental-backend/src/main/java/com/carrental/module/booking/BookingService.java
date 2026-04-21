package com.carrental.module.booking;

import com.carrental.common.enums.BookingStatus;
import com.carrental.common.enums.CalendarStatus;
import com.carrental.common.enums.PaymentMethod;
import com.carrental.common.exception.AppException;
import com.carrental.module.booking.dto.BookingDtos.*;
import com.carrental.module.car.Car;
import com.carrental.module.car.CarCalendar;
import com.carrental.module.car.CarCalendarRepository;
import com.carrental.module.car.CarRepository;
import com.carrental.module.user.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final CarCalendarRepository calendarRepository;

    // ─── Tạo đơn đặt xe ─────────────────────────────────

    @Transactional
    public Booking createBooking(CreateBookingRequest req, User customer) {
        // Validate ngày
        if (!req.getStartDate().isBefore(req.getEndDate()) &&
            !req.getStartDate().isEqual(req.getEndDate())) {
            throw AppException.badRequest("Ngày trả phải sau ngày nhận");
        }
        if (req.getStartDate().isBefore(LocalDate.now())) {
            throw AppException.badRequest("Ngày nhận xe không thể là ngày trong quá khứ");
        }

        Car car = carRepository.findById(req.getCarId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy xe"));

        // Không được tự đặt xe của mình
        if (car.getHost().getId().equals(customer.getId())) {
            throw AppException.badRequest("Bạn không thể đặt xe của chính mình");
        }

        // Kiểm tra xe đã có đơn trong khoảng ngày này chưa
        boolean hasConflict = bookingRepository.existsActiveBookingInRange(
                car.getId(), req.getStartDate(), req.getEndDate());
        if (hasConflict) {
            throw AppException.conflict("Xe đã được đặt trong khoảng thời gian này");
        }

        // Kiểm tra lịch xe (ngày BLOCKED hoặc BOOKED)
        List<CarCalendar> blockedDays = calendarRepository
                .findByCarIdAndDateBetweenOrderByDate(
                        car.getId(), req.getStartDate(), req.getEndDate())
                .stream()
                .filter(c -> c.getStatus() != CalendarStatus.AVAILABLE)
                .toList();

        if (!blockedDays.isEmpty()) {
            throw AppException.conflict(
                "Xe không khả dụng trong các ngày: " +
                blockedDays.stream()
                           .map(c -> c.getDate().toString())
                           .reduce((a, b) -> a + ", " + b)
                           .orElse(""));
        }

        // Tính số ngày và tổng tiền
        long totalDays = req.getStartDate().datesUntil(req.getEndDate().plusDays(1)).count();
        BigDecimal totalPrice = car.getPricePerDay()
                .multiply(BigDecimal.valueOf(totalDays))
                .add(car.getDeposit());

        Booking booking = Booking.builder()
                .customer(customer)
                .car(car)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .totalDays((int) totalDays)
                .pricePerDay(car.getPricePerDay())
                .depositAmount(car.getDeposit())
                .totalPrice(totalPrice)
                .driverName(req.getDriverName())
                .driverIdCard(req.getDriverIdCard())
                .driverPhone(req.getDriverPhone())
                .paymentMethod(req.getPaymentMethod())
                .status(BookingStatus.PENDING_PAYMENT)
                .build();

        return bookingRepository.save(booking);
    }

    // ─── Sau khi thanh toán thành công ──────────────────

    @Transactional
    public void onPaymentSuccess(Long bookingId) {
        Booking booking = getBookingById(bookingId);

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            log.warn("Booking {} already processed, status={}", bookingId, booking.getStatus());
            return;
        }

        booking.setStatus(BookingStatus.PENDING_CONFIRM);
        // Host có 2 giờ để xác nhận
        booking.setConfirmDeadline(LocalDateTime.now().plusHours(2));
        bookingRepository.save(booking);

        log.info("Booking {} moved to PENDING_CONFIRM", bookingId);
    }

    // ─── Host: Xác nhận đơn ─────────────────────────────

    @Transactional
    public void confirmBooking(Long bookingId, User host) {
        Booking booking = getBookingAndVerifyHost(bookingId, host);

        if (booking.getStatus() != BookingStatus.PENDING_CONFIRM) {
            throw AppException.badRequest("Đơn này không ở trạng thái chờ xác nhận");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        // Tự động đánh dấu lịch xe là BOOKED
        markCalendarBooked(booking);

        log.info("Host {} confirmed booking {}", host.getEmail(), bookingId);
    }

    // ─── Host: Từ chối đơn ──────────────────────────────

    @Transactional
    public void rejectBooking(Long bookingId, String reason, User host) {
        Booking booking = getBookingAndVerifyHost(bookingId, host);

        if (booking.getStatus() != BookingStatus.PENDING_CONFIRM) {
            throw AppException.badRequest("Đơn này không ở trạng thái chờ xác nhận");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason("Host từ chối: " + reason);
        bookingRepository.save(booking);

        log.info("Host {} rejected booking {}: {}", host.getEmail(), bookingId, reason);
        // TODO: trigger hoàn tiền tự động nếu đã thanh toán
    }

    // ─── Customer: Hủy đơn ──────────────────────────────

    @Transactional
    public void cancelBooking(Long bookingId, String reason, User customer) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn"));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw AppException.forbidden("Bạn không có quyền hủy đơn này");
        }

        List<BookingStatus> cancellableStatuses = List.of(
                BookingStatus.PENDING_PAYMENT,
                BookingStatus.PENDING_CONFIRM,
                BookingStatus.CONFIRMED
        );
        if (!cancellableStatuses.contains(booking.getStatus())) {
            throw AppException.badRequest("Không thể hủy đơn ở trạng thái: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(reason != null ? reason : "Khách hàng hủy đơn");
        bookingRepository.save(booking);

        // Giải phóng lịch xe nếu đã CONFIRMED
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            freeCalendar(booking);
        }

        log.info("Customer {} cancelled booking {}", customer.getEmail(), bookingId);
    }

    // ─── Host: Xác nhận trả xe (COMPLETED) ──────────────

    @Transactional
    public void completeBooking(Long bookingId, User host) {
        Booking booking = getBookingAndVerifyHost(bookingId, host);

        if (booking.getStatus() != BookingStatus.IN_PROGRESS &&
            booking.getStatus() != BookingStatus.CONFIRMED) {
            throw AppException.badRequest("Không thể hoàn thành đơn ở trạng thái hiện tại");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        log.info("Booking {} completed by host {}", bookingId, host.getEmail());
    }

    // ─── Customer: Xem danh sách đơn ────────────────────

    public Page<BookingSummary> getMyBookings(User customer, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return bookingRepository.findByCustomerOrderByCreatedAtDesc(customer, pageable)
                .map(this::toSummary);
    }

    // ─── Host: Xem đơn chờ xác nhận ─────────────────────

    public List<BookingSummary> getIncomingBookings(User host) {
        return bookingRepository.findByHostAndStatusIn(
                host,
                List.of(BookingStatus.PENDING_CONFIRM, BookingStatus.CONFIRMED)
        ).stream().map(this::toSummary).toList();
    }

    // ─── Xem chi tiết đơn ───────────────────────────────

    public BookingDetail getBookingDetail(Long bookingId, User user) {
        Booking booking = bookingRepository.findByIdAndUser(bookingId, user)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn"));
        return toDetail(booking);
    }

    // ─── Calendar helpers ────────────────────────────────

    @Transactional
    public void markCalendarBooked(Booking booking) {
        LocalDate cursor = booking.getStartDate();
        while (!cursor.isAfter(booking.getEndDate())) {
            LocalDate date = cursor;
            calendarRepository.findByCarIdAndDate(booking.getCar().getId(), date)
                    .ifPresentOrElse(
                            cal -> {
                                cal.setStatus(CalendarStatus.BOOKED);
                                cal.setBookingId(booking.getId());
                                calendarRepository.save(cal);
                            },
                            () -> calendarRepository.save(
                                    CarCalendar.builder()
                                            .car(booking.getCar())
                                            .date(date)
                                            .status(CalendarStatus.BOOKED)
                                            .bookingId(booking.getId())
                                            .build()
                            )
                    );
            cursor = cursor.plusDays(1);
        }
    }

    @Transactional
    public void freeCalendar(Booking booking) {
        calendarRepository.findByCarIdAndDateBetweenOrderByDate(
                booking.getCar().getId(),
                booking.getStartDate(),
                booking.getEndDate()
        ).stream()
         .filter(c -> booking.getId().equals(c.getBookingId()))
         .forEach(c -> {
             c.setStatus(CalendarStatus.AVAILABLE);
             c.setBookingId(null);
             calendarRepository.save(c);
         });
    }

    // ─── Private helpers ─────────────────────────────────

    private Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đặt xe"));
    }

    private Booking getBookingAndVerifyHost(Long bookingId, User host) {
        Booking booking = getBookingById(bookingId);
        if (!booking.getCar().getHost().getId().equals(host.getId())) {
            throw AppException.forbidden("Bạn không có quyền thao tác đơn này");
        }
        return booking;
    }

    // ─── Mappers ─────────────────────────────────────────

    public BookingSummary toSummary(Booking b) {
        BookingSummary s = new BookingSummary();
        s.setId(b.getId());
        s.setCarName(b.getCar().getFullName());
        s.setCarImageUrl(b.getCar().getPrimaryImageUrl());
        s.setProvince(b.getCar().getProvince());
        s.setStartDate(b.getStartDate());
        s.setEndDate(b.getEndDate());
        s.setTotalDays(b.getTotalDays());
        s.setTotalPrice(b.getTotalPrice());
        s.setStatus(b.getStatus());
        s.setPaymentMethod(b.getPaymentMethod());
        s.setCreatedAt(b.getCreatedAt());
        return s;
    }

    public BookingDetail toDetail(Booking b) {
        BookingDetail d = new BookingDetail();
        d.setId(b.getId());
        d.setCarId(b.getCar().getId());
        d.setCarName(b.getCar().getFullName());
        d.setCarImageUrl(b.getCar().getPrimaryImageUrl());
        d.setProvince(b.getCar().getProvince());
        d.setPricePerDay(b.getPricePerDay());
        d.setStartDate(b.getStartDate());
        d.setEndDate(b.getEndDate());
        d.setTotalDays(b.getTotalDays());
        d.setDepositAmount(b.getDepositAmount());
        d.setTotalPrice(b.getTotalPrice());
        d.setDriverName(b.getDriverName());
        d.setDriverIdCard(b.getDriverIdCard());
        d.setDriverPhone(b.getDriverPhone());
        d.setPaymentMethod(b.getPaymentMethod());
        d.setStatus(b.getStatus());
        d.setCancelReason(b.getCancelReason());
        d.setConfirmedAt(b.getConfirmedAt());
        d.setConfirmDeadline(b.getConfirmDeadline());
        d.setCreatedAt(b.getCreatedAt());

        // Host info
        User host = b.getCar().getHost();
        HostInfo hi = new HostInfo();
        hi.setId(host.getId());
        hi.setFullName(host.getFullName());
        hi.setPhone(host.getPhone());
        hi.setAvatarUrl(host.getAvatarUrl());
        d.setHost(hi);

        // Customer info
        User customer = b.getCustomer();
        CustomerInfo ci = new CustomerInfo();
        ci.setId(customer.getId());
        ci.setFullName(customer.getFullName());
        ci.setPhone(customer.getPhone());
        ci.setAvatarUrl(customer.getAvatarUrl());
        d.setCustomer(ci);

        return d;
    }
}