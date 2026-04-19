package com.carrental.module.car;

import com.carrental.common.ApiResponse;
import com.carrental.module.car.dto.CarDtos.*;
import com.carrental.module.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cars/{carId}/calendar")
@PreAuthorize("hasRole('HOST')")
@RequiredArgsConstructor
public class CalendarController {

    private final CarService carService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CalendarDay>>> getCalendar(
            @PathVariable Long carId,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().year}")   int year,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().monthValue}") int month,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                carService.getHostCalendar(carId, year, month, user)));
    }

    @PostMapping("/block")
    public ResponseEntity<ApiResponse<Void>> blockDates(
            @PathVariable Long carId,
            @Valid @RequestBody BlockDateRequest request,
            @AuthenticationPrincipal User user) {
        carService.blockDates(carId, request, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Chặn ngày thành công"));
    }

    @DeleteMapping("/block")
    public ResponseEntity<ApiResponse<Void>> unblockDates(
            @PathVariable Long carId,
            @Valid @RequestBody BlockDateRequest request,
            @AuthenticationPrincipal User user) {
        carService.unblockDates(carId, request, user);
        return ResponseEntity.ok(ApiResponse.ok(null, "Mở lịch thành công"));
    }
}