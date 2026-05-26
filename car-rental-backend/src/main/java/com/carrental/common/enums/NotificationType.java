package com.carrental.common.enums;

public enum NotificationType {
    NEW_BOOKING,          // Có người đặt xe
    BOOKING_CONFIRMED,    // Host đã xác nhận đơn
    BOOKING_CANCELLED,    // Đơn bị hủy (bởi Admin/Host/Customer)
    BOOKING_COMPLETED,    // Chuyến đi hoàn thành
    CAR_APPROVED,         // Xe đã được Admin duyệt
    CAR_REJECTED,         // Xe bị Admin từ chối
    NEW_REVIEW,           // Có đánh giá mới cho xe
    SYSTEM                // Thông báo hệ thống
}