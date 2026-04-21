package com.carrental.module.admin;

import com.carrental.common.ApiResponse;
import com.carrental.common.enums.Role;
import com.carrental.common.enums.UserStatus;
import com.carrental.module.admin.dto.AdminDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminService adminService;

    // Danh sách tất cả user (lọc theo role, status, keyword)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserSummary>>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getAllUsers(role, status, keyword, page, size)));
    }

    // Lịch sử hoạt động của một user
    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<UserActivityResponse>> getUserActivity(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getUserActivity(id)));
    }

    // Khóa tài khoản
    @PatchMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<Void>> lockUser(@PathVariable Long id) {
        adminService.lockUser(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã khóa tài khoản"));
    }

    // Mở khóa tài khoản
    @PatchMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockUser(@PathVariable Long id) {
        adminService.unlockUser(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã mở khóa tài khoản"));
    }
}