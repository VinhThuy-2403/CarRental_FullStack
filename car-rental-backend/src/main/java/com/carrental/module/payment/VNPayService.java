package com.carrental.module.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
public class VNPayService {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.url}")
    private String vnpayUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.ipn-url}")
    private String ipnUrl;

    /**
     * Tạo URL thanh toán VNPay
     * @param transactionId mã đơn hàng của hệ thống
     * @param amount        số tiền (VNĐ)
     * @param orderInfo     mô tả đơn hàng
     * @param ipAddress     IP khách hàng
     */
    public String createPaymentUrl(String transactionId, BigDecimal amount,
                                   String orderInfo, String ipAddress) {
        String vnpVersion   = "2.1.0";
        String vnpCommand   = "pay";
        String vnpCurrCode  = "VND";
        String vnpLocale    = "vn";
        String vnpOrderType = "other";

        // VNPay yêu cầu số tiền × 100 (không có phần thập phân)
        long vnpAmount = amount.multiply(BigDecimal.valueOf(100)).longValue();

        String vnpCreateDate = new SimpleDateFormat("yyyyMMddHHmmss")
                .format(new Date());
        // Expire sau 15 phút
        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        cal.add(Calendar.MINUTE, 15);
        String vnpExpireDate = new SimpleDateFormat("yyyyMMddHHmmss").format(cal.getTime());

        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version",    vnpVersion);
        vnpParams.put("vnp_Command",    vnpCommand);
        vnpParams.put("vnp_TmnCode",    tmnCode);
        vnpParams.put("vnp_Amount",     String.valueOf(vnpAmount));
        vnpParams.put("vnp_CurrCode",   vnpCurrCode);
        vnpParams.put("vnp_TxnRef",     transactionId);
        vnpParams.put("vnp_OrderInfo",  orderInfo);
        vnpParams.put("vnp_OrderType",  vnpOrderType);
        vnpParams.put("vnp_Locale",     vnpLocale);
        vnpParams.put("vnp_ReturnUrl",  returnUrl);
        vnpParams.put("vnp_IpAddr",     ipAddress);
        vnpParams.put("vnp_CreateDate", vnpCreateDate);
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        // Build query string (TreeMap đã sort theo key)
        StringBuilder hashData    = new StringBuilder();
        StringBuilder queryString = new StringBuilder();

        for (Map.Entry<String, String> entry : vnpParams.entrySet()) {
            String key = entry.getKey();
            String val = entry.getValue();
            if (val != null && !val.isEmpty()) {
                hashData.append(key).append('=')
                        .append(URLEncoder.encode(val, StandardCharsets.US_ASCII));
                queryString.append(URLEncoder.encode(key, StandardCharsets.US_ASCII))
                           .append('=')
                           .append(URLEncoder.encode(val, StandardCharsets.US_ASCII));
                hashData.append('&');
                queryString.append('&');
            }
        }

        // Xóa & cuối
        if (hashData.length() > 0) hashData.deleteCharAt(hashData.length() - 1);
        if (queryString.length() > 0) queryString.deleteCharAt(queryString.length() - 1);

        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        queryString.append("&vnp_SecureHash=").append(secureHash);

        return vnpayUrl + "?" + queryString;
    }

    /**
     * Xác minh chữ ký từ VNPay callback
     */
    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        // Loại bỏ hash fields, sort và build lại
        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashData.append(entry.getKey()).append('=')
                        .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII))
                        .append('&');
            }
        }
        if (hashData.length() > 0) hashData.deleteCharAt(hashData.length() - 1);

        String expectedHash = hmacSHA512(hashSecret, hashData.toString());
        return expectedHash.equalsIgnoreCase(receivedHash);
    }

    /**
     * Kiểm tra response code thành công
     */
    public boolean isSuccess(String responseCode) {
        return "00".equals(responseCode);
    }

    // ─── HMAC-SHA512 ─────────────────────────────────────
    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            log.error("HMAC-SHA512 error: {}", e.getMessage());
            throw new RuntimeException("Lỗi tạo chữ ký HMAC", e);
        }
    }
}