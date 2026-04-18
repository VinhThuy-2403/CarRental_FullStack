package com.carrental.module.auth;

import com.carrental.common.enums.Role;
import com.carrental.common.enums.UserStatus;
import com.carrental.common.exception.AppException;
import com.carrental.module.auth.dto.AuthDtos.*;
import com.carrental.module.auth.dto.RegisterRequest;
import com.carrental.module.user.User;
import com.carrental.module.user.UserRepository;
import com.carrental.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    // ─── Register ────────────────────────────────────────

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Email đã được sử dụng");
        }

        // Admin không thể tự đăng ký
        if (request.getRole() == Role.ADMIN) {
            throw AppException.forbidden("Không thể đăng ký với vai trò Admin");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .status(UserStatus.ACTIVE) // Tạm thời ACTIVE, sau có thể thêm email verify
                .build();

        userRepository.save(user);
        log.info("Registered new user: {} ({})", user.getEmail(), user.getRole());
    }

    // ─── Login ───────────────────────────────────────────

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // Spring Security xác thực — tự throw BadCredentialsException nếu sai
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw AppException.forbidden("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
        }

        // Revoke tất cả refresh token cũ
        refreshTokenRepository.revokeAllUserTokens(user);

        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        // Lưu refresh token mới
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build());

        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setFullName(user.getFullName());
        userInfo.setEmail(user.getEmail());
        userInfo.setRole(user.getRole().name());
        userInfo.setAvatarUrl(user.getAvatarUrl());

        LoginResponse response = new LoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setUser(userInfo);

        return response;
    }

    // ─── Refresh Token ───────────────────────────────────

    @Transactional
    public TokenRefreshResponse refresh(TokenRefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> AppException.unauthorized("Refresh token không hợp lệ"));

        if (stored.isRevoked() || stored.isExpired()) {
            throw AppException.unauthorized("Refresh token đã hết hạn hoặc bị thu hồi");
        }

        User user = stored.getUser();

        // Revoke token cũ và cấp mới (rotation)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newAccess  = jwtUtil.generateAccessToken(user);
        String newRefresh = jwtUtil.generateRefreshToken(user);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(newRefresh)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build());

        TokenRefreshResponse response = new TokenRefreshResponse();
        response.setAccessToken(newAccess);
        response.setRefreshToken(newRefresh);
        return response;
    }

    // ─── Logout ──────────────────────────────────────────

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    // ─── Forgot Password ─────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            String resetLink = baseUrl + "/reset-password?token=" + token;
            sendResetEmail(user.getEmail(), user.getFullName(), resetLink);
            log.info("Sent password reset email to {}", user.getEmail());
        });
        // Không throw lỗi nếu email không tồn tại (tránh email enumeration)
    }

    // ─── Reset Password ──────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> AppException.badRequest("Token không hợp lệ hoặc đã hết hạn"));

        if (user.getResetPasswordTokenExpiry() == null ||
            LocalDateTime.now().isAfter(user.getResetPasswordTokenExpiry())) {
            throw AppException.badRequest("Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        // Revoke tất cả refresh token sau khi reset mật khẩu
        refreshTokenRepository.revokeAllUserTokens(user);
    }

    // ─── Change Password ─────────────────────────────────

    @Transactional
    public void changePassword(ChangePasswordRequest request, User currentUser) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw AppException.badRequest("Mật khẩu hiện tại không đúng");
        }

        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);

        // Revoke tất cả refresh token
        refreshTokenRepository.revokeAllUserTokens(currentUser);
    }

    // ─── Helper ──────────────────────────────────────────

    private void sendResetEmail(String to, String name, String link) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("[XeGo] Đặt lại mật khẩu");
            message.setText(
                "Xin chào " + name + ",\n\n" +
                "Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào link bên dưới (hết hạn sau 15 phút):\n\n" +
                link + "\n\n" +
                "Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.\n\n" +
                "Trân trọng,\nĐội ngũ XeGo"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", to, e.getMessage());
        }
    }
}