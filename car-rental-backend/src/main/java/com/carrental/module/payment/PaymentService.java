package com.carrental.module.payment;

import com.carrental.common.enums.PaymentMethod;
import com.carrental.common.enums.PaymentStatus;
import com.carrental.common.exception.AppException;
import com.carrental.module.booking.Booking;
import com.carrental.module.booking.BookingRepository;
import com.carrental.module.booking.BookingService;
import com.carrental.module.payment.dto.PaymentDtos.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final VNPayService vnPayService;
    private final MoMoService moMoService;
    private final ObjectMapper objectMapper;

    // ─── Tạo URL thanh toán VNPay ────────────────────────

    @Transactional
    public PaymentUrlResponse createVNPayUrl(Long bookingId, String ipAddress) {
        Booking booking = getBookingForPayment(bookingId);

        String txnRef = "XEGO-" + bookingId + "-" + System.currentTimeMillis();

        // Tạo hoặc cập nhật bản ghi Payment
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(Payment.builder()
                        .booking(booking)
                        .method(PaymentMethod.VNPAY)
                        .amount(booking.getTotalPrice())
                        .build());

        payment.setMethod(PaymentMethod.VNPAY);
        payment.setTransactionId(txnRef);
        payment.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(payment);

        String orderInfo = "Thanh toan dat xe " + booking.getCar().getFullName()
                + " tu " + booking.getStartDate() + " den " + booking.getEndDate();

        String paymentUrl = vnPayService.createPaymentUrl(
                txnRef, booking.getTotalPrice(), orderInfo, ipAddress);

        PaymentUrlResponse res = new PaymentUrlResponse();
        res.setPaymentUrl(paymentUrl);
        res.setTransactionId(txnRef);
        res.setBookingId(bookingId);
        return res;
    }

    // ─── VNPay Return URL callback (redirect từ VNPay) ───

    @Transactional
    public boolean handleVNPayReturn(Map<String, String> params) {
        if (!vnPayService.verifySignature(params)) {
            log.warn("VNPay return: invalid signature, params={}", params);
            return false;
        }

        String txnRef      = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String gatewayTxnId = params.get("vnp_TransactionNo");

        Payment payment = paymentRepository.findByTransactionId(txnRef)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giao dịch: " + txnRef));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("VNPay return: already processed txnRef={}", txnRef);
            return true;
        }

        boolean success = vnPayService.isSuccess(responseCode);
        updatePaymentStatus(payment, success, gatewayTxnId, params.toString());

        if (success) {
            bookingService.onPaymentSuccess(payment.getBooking().getId());
        }

        return success;
    }

    // ─── VNPay IPN (server-to-server, authoritative) ─────

    @Transactional
    public String handleVNPayIPN(Map<String, String> params) {
        if (!vnPayService.verifySignature(params)) {
            log.warn("VNPay IPN: invalid signature");
            return "{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}";
        }

        String txnRef      = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String gatewayTxnId = params.get("vnp_TransactionNo");

        Payment payment = paymentRepository.findByTransactionId(txnRef).orElse(null);
        if (payment == null) {
            return "{\"RspCode\":\"01\",\"Message\":\"Order not found\"}";
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
        }

        boolean success = vnPayService.isSuccess(responseCode);
        updatePaymentStatus(payment, success, gatewayTxnId, params.toString());

        if (success) {
            bookingService.onPaymentSuccess(payment.getBooking().getId());
        }

        return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
    }

    // ─── Tạo URL thanh toán MoMo ─────────────────────────

    @Transactional
    public PaymentUrlResponse createMoMoUrl(Long bookingId) {
        Booking booking = getBookingForPayment(bookingId);

        String orderId = "XEGO-" + bookingId + "-" + System.currentTimeMillis();
        String orderInfo = "Dat xe " + booking.getCar().getFullName();

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElse(Payment.builder()
                        .booking(booking)
                        .method(PaymentMethod.MOMO)
                        .amount(booking.getTotalPrice())
                        .build());

        payment.setMethod(PaymentMethod.MOMO);
        payment.setTransactionId(orderId);
        payment.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(payment);

        String paymentUrl = moMoService.createPaymentUrl(
                orderId, booking.getTotalPrice().longValue(), orderInfo);

        if (paymentUrl == null) {
            throw AppException.badRequest("Không thể tạo URL thanh toán MoMo. Vui lòng thử lại.");
        }

        PaymentUrlResponse res = new PaymentUrlResponse();
        res.setPaymentUrl(paymentUrl);
        res.setTransactionId(orderId);
        res.setBookingId(bookingId);
        return res;
    }

    // ─── MoMo IPN callback ───────────────────────────────

    @Transactional
    public void handleMoMoCallback(Map<String, Object> params) {
        if (!moMoService.verifySignature(params)) {
            log.warn("MoMo IPN: invalid signature");
            return;
        }

        String orderId  = (String) params.get("orderId");
        Object transId  = params.get("transId");
        Object resultCodeObj = params.get("resultCode");
        Integer resultCode = resultCodeObj instanceof Integer
                ? (Integer) resultCodeObj
                : Integer.parseInt(String.valueOf(resultCodeObj));

        Payment payment = paymentRepository.findByTransactionId(orderId).orElse(null);
        if (payment == null) {
            log.warn("MoMo IPN: payment not found for orderId={}", orderId);
            return;
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("MoMo IPN: already processed orderId={}", orderId);
            return;
        }

        boolean success = moMoService.isSuccess(resultCode);
        updatePaymentStatus(payment, success,
                transId != null ? transId.toString() : null,
                params.toString());

        if (success) {
            bookingService.onPaymentSuccess(payment.getBooking().getId());
        }
    }

    // ─── Thanh toán tiền mặt (host xác nhận) ─────────────

    @Transactional
    public void confirmCashPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn"));

        Payment payment = Payment.builder()
                .booking(booking)
                .method(PaymentMethod.CASH)
                .amount(booking.getTotalPrice())
                .transactionId("CASH-" + bookingId + "-" + UUID.randomUUID().toString().substring(0, 8))
                .status(PaymentStatus.SUCCESS)
                .paidAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);
        bookingService.onPaymentSuccess(bookingId);
    }

    // ─── Xem chi tiết giao dịch ─────────────────────────

    public PaymentResponse getPaymentByBooking(Long bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy giao dịch"));
        return toResponse(payment);
    }

    // ─── Helpers ─────────────────────────────────────────

    private Booking getBookingForPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đặt xe"));

        if (booking.getStatus() != com.carrental.common.enums.BookingStatus.PENDING_PAYMENT) {
            throw AppException.badRequest("Đơn này không ở trạng thái chờ thanh toán");
        }
        return booking;
    }

    private void updatePaymentStatus(Payment payment, boolean success,
                                     String gatewayTxnId, String rawResponse) {
        payment.setStatus(success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
        payment.setGatewayTransactionId(gatewayTxnId);
        payment.setRawResponse(rawResponse);
        if (success) payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    public PaymentResponse toResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setBookingId(p.getBooking().getId());
        r.setMethod(p.getMethod());
        r.setAmount(p.getAmount());
        r.setTransactionId(p.getTransactionId());
        r.setStatus(p.getStatus());
        r.setPaidAt(p.getPaidAt());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}