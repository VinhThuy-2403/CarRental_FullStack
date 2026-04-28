package com.carrental.module.booking;

import com.carrental.common.ApiResponse;
import com.carrental.module.booking.dto.BookingDtos.*;
import com.carrental.module.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ─── Customer endpoints ──────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<BookingDetail>> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal User user) {
        Booking booking = bookingService.createBooking(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        bookingService.toDetail(booking),
                        "Đặt xe thành công! Vui lòng tiến hành thanh toán."));
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<BookingSummary>>> getMyBookings(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                bookingService.getMyBookings(user, page, size)));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) CancelBookingRequest request,
            @AuthenticationPrincipal User user) {
        String reason = request != null ? request.getReason() : null;
        bookingService.cancelBooking(id, reason, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Hủy đơn thành công"));
    }

    // ─── Host endpoints ──────────────────────────────────

    // --- Tìm hàm getIncomingBookings và sửa lại như sau ---
@GetMapping("/host/incoming")
@PreAuthorize("hasRole('HOST')")
public ResponseEntity<ApiResponse<List<BookingSummary>>> getIncomingBookings(
        @AuthenticationPrincipal User user,
        @RequestParam(required = false) com.carrental.common.enums.BookingStatus status) { // Thêm @RequestParam status
    return ResponseEntity.ok(ApiResponse.ok(
            bookingService.getIncomingBookings(user, status))); // Truyền status vào service
}

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> confirmBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        bookingService.confirmBooking(id, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xác nhận đơn thành công"));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody RejectBookingRequest request,
            @AuthenticationPrincipal User user) {
        bookingService.rejectBooking(id, request.getReason(), user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã từ chối đơn"));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> completeBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        bookingService.completeBooking(id, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã hoàn thành chuyến"));
    }

    // ─── Shared: Customer + Host ─────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'HOST')")
    public ResponseEntity<ApiResponse<BookingDetail>> getBookingDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                bookingService.getBookingDetail(id, user)));
    }

    @PatchMapping("/{id}/start")
@PreAuthorize("hasRole('HOST')")
public ResponseEntity<ApiResponse<Void>> startBooking(@PathVariable Long id, @AuthenticationPrincipal User host) {
    bookingService.startBooking(id, host);
    return ResponseEntity.ok(ApiResponse.ok(null, "Đã xác nhận giao xe. Chuyến đi bắt đầu!"));
}
}