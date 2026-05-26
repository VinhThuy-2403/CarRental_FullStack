package com.carrental.module.notification;

import com.carrental.common.ApiResponse;
import com.carrental.common.PageResponse;
import com.carrental.module.notification.dto.NotificationResponse;
import com.carrental.module.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Lấy danh sách thông báo của user đang đăng nhập
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal User principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationResponse> notifications = notificationService
                .getUserNotifications(principal.getId(), pageable)
                .map(NotificationResponse::from);
                
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(notifications)));
    }

    // Lấy số lượng thông báo chưa đọc
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal User principal) {
        
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    // Đánh dấu 1 thông báo là đã đọc
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã đánh dấu đọc"));
    }

    // Đánh dấu TẤT CẢ là đã đọc
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal User principal) {
        
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Đã đánh dấu đọc tất cả"));
    }
}