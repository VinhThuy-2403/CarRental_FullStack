package com.carrental.common.enums;

public enum CarStatus {
    PENDING,    // Chờ admin duyệt
    APPROVED,   // Đã duyệt, hiển thị cho khách
    REJECTED,   // Bị từ chối
    INACTIVE    // Host tạm ẩn
}