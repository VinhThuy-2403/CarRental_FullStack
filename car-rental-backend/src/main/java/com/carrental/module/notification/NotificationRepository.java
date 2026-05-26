package com.carrental.module.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Lấy danh sách thông báo của 1 user, sắp xếp mới nhất lên đầu
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Đếm số lượng thông báo chưa đọc của user
    long countByUserIdAndIsReadFalse(Long userId);
}