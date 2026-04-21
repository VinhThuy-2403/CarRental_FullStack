package com.carrental.module.payment;

import com.carrental.common.ApiResponse;
import com.carrental.module.payment.dto.PaymentDtos.*;
import com.carrental.module.user.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Value("${app.base-url}")
    private String baseUrl;

    // ─── VNPay ───────────────────────────────────────────

    @PostMapping("/vnpay/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> createVNPay(
            @RequestParam Long bookingId,
            HttpServletRequest request) {
        String ipAddress = getClientIpAddress(request);
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.createVNPayUrl(bookingId, ipAddress),
                "Tạo URL thanh toán thành công"));
    }

    // VNPay redirect về sau khi thanh toán (người dùng nhìn thấy)
    @GetMapping("/vnpay/callback")
    public ResponseEntity<Void> vnPayReturn(
            @RequestParam Map<String, String> params) {
        boolean success = paymentService.handleVNPayReturn(params);
        // Redirect về frontend với kết quả
        String redirectUrl = baseUrl + "/payment/result?status=" + (success ? "success" : "failed")
                + "&bookingId=" + params.getOrDefault("vnp_TxnRef", "").replace("XEGO-", "").split("-")[0];
        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .build();
    }

    // VNPay IPN — server-to-server, đây là callback authoritative
    @PostMapping("/vnpay/ipn")
    public ResponseEntity<String> vnPayIPN(
            @RequestParam Map<String, String> params) {
        String result = paymentService.handleVNPayIPN(params);
        return ResponseEntity.ok(result);
    }

    // ─── MoMo ────────────────────────────────────────────

    @PostMapping("/momo/create")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> createMoMo(
            @RequestParam Long bookingId) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.createMoMoUrl(bookingId),
                "Tạo URL thanh toán MoMo thành công"));
    }

    @PostMapping("/momo/callback")
    public ResponseEntity<String> moMoCallback(
            @RequestBody Map<String, Object> params) {
        paymentService.handleMoMoCallback(params);
        return ResponseEntity.ok("{\"status\":200}");
    }

    // ─── Cash (Tiền mặt) ─────────────────────────────────

    @PostMapping("/cash/confirm")
    @PreAuthorize("hasRole('HOST')")
    public ResponseEntity<ApiResponse<Void>> confirmCash(
            @RequestParam Long bookingId) {
        paymentService.confirmCashPayment(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xác nhận thanh toán tiền mặt thành công"));
    }

    // ─── Shared ──────────────────────────────────────────

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'HOST')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByBooking(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.getPaymentByBooking(bookingId)));
    }

    // ─── Helper: Lấy IP thực của client ─────────────────

    private String getClientIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        // Lấy IP đầu tiên nếu có nhiều
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }
}