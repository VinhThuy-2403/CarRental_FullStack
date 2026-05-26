package com.carrental.module.notification;

import com.carrental.common.enums.NotificationType;
import com.carrental.module.user.User;
import com.carrental.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Tạo và lưu thông báo mới vào Database.
     * Hàm này đang được gọi bởi ReviewService, BookingService,...
     */
    @Transactional
    public void createNotification(Long userId, NotificationType type, String title, String message, Long referenceId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user để gửi thông báo"));

            Notification notification = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .referenceId(referenceId)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            
            // TODO: Ở các bước sau, bạn có thể tích hợp thêm WebSocket (STOMP) ở đây 
            // để push thông báo realtime về cho Frontend.
            log.info("Đã tạo thông báo cho user {}: {}", userId, title);

        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo cho user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Lấy danh sách thông báo của User (hỗ trợ phân trang)
     */
    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Đếm số thông báo chưa đọc (để hiển thị badge số màu đỏ trên icon chuông ở Frontend)
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Đánh dấu 1 thông báo là đã đọc
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    /**
     * Đánh dấu TẤT CẢ thông báo của 1 user là đã đọc
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        // Tối ưu bằng cách chỉ update những thông báo chưa đọc
        var unreadNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged())
                .stream()
                .filter(n -> !n.isRead())
                .toList();

        unreadNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }
}