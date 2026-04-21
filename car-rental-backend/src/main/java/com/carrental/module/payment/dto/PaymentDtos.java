package com.carrental.module.payment.dto;

import com.carrental.common.enums.PaymentMethod;
import com.carrental.common.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDtos {

    // ─── Response: URL thanh toán ────────────────────────
    @Data
    public static class PaymentUrlResponse {
        private String paymentUrl;
        private String transactionId;
        private Long bookingId;
    }

    // ─── Response: Chi tiết giao dịch ───────────────────
    @Data
    public static class PaymentResponse {
        private Long id;
        private Long bookingId;
        private PaymentMethod method;
        private BigDecimal amount;
        private String transactionId;
        private PaymentStatus status;
        private LocalDateTime paidAt;
        private LocalDateTime createdAt;
    }

    // ─── VNPay callback params ───────────────────────────
    @Data
    public static class VNPayCallbackParams {
        private String vnp_TxnRef;       // Mã đơn hàng
        private String vnp_Amount;       // Số tiền × 100
        private String vnp_ResponseCode; // 00 = thành công
        private String vnp_TransactionNo;// Mã GD phía VNPay
        private String vnp_BankCode;
        private String vnp_PayDate;
        private String vnp_OrderInfo;
        private String vnp_SecureHash;   // Chữ ký HMAC
    }

    // ─── MoMo callback params ────────────────────────────
    @Data
    public static class MoMoCallbackParams {
        private String partnerCode;
        private String orderId;
        private String requestId;
        private Long amount;
        private String orderInfo;
        private String orderType;
        private String transId;
        private Integer resultCode; // 0 = thành công
        private String message;
        private String payType;
        private Long responseTime;
        private String extraData;
        private String signature;
    }
}