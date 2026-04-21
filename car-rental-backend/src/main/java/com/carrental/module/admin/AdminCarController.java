package com.carrental.module.admin;

import com.carrental.common.ApiResponse;
import com.carrental.common.enums.CarStatus;
import com.carrental.module.admin.dto.AdminDtos.*;
import com.carrental.module.car.dto.CarDtos.CarDetail;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/cars")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCarController {

    private final AdminService adminService;

    // Danh sách xe chờ duyệt
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<AdminCarSummary>>> getPendingCars(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getPendingCars(page, size)));
    }

    // Tất cả xe (có filter)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminCarSummary>>> getAllCars(
            @RequestParam(required = false) CarStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getAllCars(status, keyword, page, size)));
    }

    // Chi tiết xe (dùng khi admin review trước khi duyệt)
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CarDetail>> getCarDetail(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getCarDetailForAdmin(id)));
    }

    // Duyệt xe
    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveCar(@PathVariable Long id) {
        adminService.approveCar(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Duyệt xe thành công"));
    }

    // Từ chối xe
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectCar(
            @PathVariable Long id,
            @Valid @RequestBody RejectCarRequest request) {
        adminService.rejectCar(id, request.getReason());
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã từ chối xe"));
    }
}