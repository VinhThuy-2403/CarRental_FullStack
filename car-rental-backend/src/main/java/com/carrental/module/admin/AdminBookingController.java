package com.carrental.module.admin;

import com.carrental.common.ApiResponse;
import com.carrental.common.enums.BookingStatus;
import com.carrental.module.admin.dto.AdminDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminService adminService;

    // Tất cả đơn đặt (filter theo status)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminBookingSummary>>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getAllBookings(status, page, size)));
    }
}