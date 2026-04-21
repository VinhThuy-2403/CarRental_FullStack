package com.carrental.common.enums;

public enum BookingStatus {
    PENDING_PAYMENT,  // Chờ thanh toán
    PENDING_CONFIRM,  // Đã thanh toán, chờ host xác nhận
    CONFIRMED,        // Host xác nhận
    IN_PROGRESS,      // Đang thuê
    COMPLETED,        // Hoàn thành
    CANCELLED,        // Đã hủy
    REFUNDED          // Đã hoàn tiền
}