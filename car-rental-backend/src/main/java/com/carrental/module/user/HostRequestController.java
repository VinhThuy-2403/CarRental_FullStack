package com.carrental.module.user;

import com.carrental.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HostRequestController {

    private final HostRequestService hostRequestService;

    // ─── CUSTOMER endpoints ───────────────────────────────

    /** Gửi yêu cầu trở thành Host */
    @PostMapping("/api/v1/users/me/request-host")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> requestHost(
            @AuthenticationPrincipal User currentUser) {
        hostRequestService.requestHost(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(null, "Yêu cầu đã được gửi. Admin sẽ xem xét sớm!"));
    }

    /** Xem trạng thái yêu cầu của mình */
    @GetMapping("/api/v1/users/me/request-host/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyRequestStatus(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(hostRequestService.getMyRequestStatus(currentUser)));
    }

    // ─── ADMIN endpoints ──────────────────────────────────

    /** Lấy danh sách yêu cầu PENDING */
    @GetMapping("/api/v1/admin/host-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<HostRequestDto>>> getPendingRequests(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<HostRequest> requests = hostRequestService.getPendingRequests(page, size);
        Page<HostRequestDto> dtos  = requests.map(HostRequestDto::from);
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    /** Duyệt yêu cầu */
    @PatchMapping("/api/v1/admin/host-requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long id) {
        hostRequestService.approve(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã duyệt. Tài khoản đã được nâng cấp lên Host!"));
    }

    /** Từ chối yêu cầu */
    @PatchMapping("/api/v1/admin/host-requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.getOrDefault("adminNote", "") : "";
        hostRequestService.reject(id, note);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã từ chối yêu cầu."));
    }
}
