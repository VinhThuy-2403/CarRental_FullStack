package com.carrental.module.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class MoMoService {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.api-url}")
    private String apiUrl;

    @Value("${momo.return-url}")
    private String returnUrl;

    @Value("${momo.notify-url}")
    private String notifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Tạo URL thanh toán MoMo
     */
    public String createPaymentUrl(String orderId, long amount, String orderInfo) {
        try {
            String requestId = UUID.randomUUID().toString();
            String extraData = "";
            String requestType = "payWithATM"; // hoặc "captureWallet" cho ví MoMo

            String rawSignature = "accessKey=" + accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + notifyUrl +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + partnerCode +
                    "&redirectUrl=" + returnUrl +
                    "&requestId=" + requestId +
                    "&requestType=" + requestType;

            String signature = hmacSHA256(secretKey, rawSignature);

            Map<String, Object> body = new HashMap<>();
            body.put("partnerCode",  partnerCode);
            body.put("accessKey",    accessKey);
            body.put("requestId",    requestId);
            body.put("amount",       amount);
            body.put("orderId",      orderId);
            body.put("orderInfo",    orderInfo);
            body.put("redirectUrl",  returnUrl);
            body.put("ipnUrl",       notifyUrl);
            body.put("extraData",    extraData);
            body.put("requestType",  requestType);
            body.put("signature",    signature);
            body.put("lang",         "vi");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<?, ?> responseBody = response.getBody();
                Integer resultCode = (Integer) responseBody.get("resultCode");
                if (resultCode == 0) {
                    return (String) responseBody.get("payUrl");
                }
                log.error("MoMo create payment failed: {}", responseBody.get("message"));
            }
            return null;
        } catch (Exception e) {
            log.error("MoMo createPaymentUrl error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Xác minh chữ ký callback từ MoMo
     */
    public boolean verifySignature(Map<String, Object> params) {
        try {
            String receivedSignature = (String) params.get("signature");
            if (receivedSignature == null) return false;

            String rawSignature = "accessKey=" + accessKey +
                    "&amount=" + params.get("amount") +
                    "&extraData=" + params.get("extraData") +
                    "&message=" + params.get("message") +
                    "&orderId=" + params.get("orderId") +
                    "&orderInfo=" + params.get("orderInfo") +
                    "&orderType=" + params.get("orderType") +
                    "&partnerCode=" + params.get("partnerCode") +
                    "&payType=" + params.get("payType") +
                    "&requestId=" + params.get("requestId") +
                    "&responseTime=" + params.get("responseTime") +
                    "&resultCode=" + params.get("resultCode") +
                    "&transId=" + params.get("transId");

            String expectedSignature = hmacSHA256(secretKey, rawSignature);
            return expectedSignature.equals(receivedSignature);
        } catch (Exception e) {
            log.error("MoMo verify signature error: {}", e.getMessage());
            return false;
        }
    }

    public boolean isSuccess(Integer resultCode) {
        return resultCode != null && resultCode == 0;
    }

    private String hmacSHA256(String key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}