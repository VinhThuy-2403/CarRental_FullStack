package com.carrental.module.auth;

import com.carrental.common.enums.Role;
import com.carrental.common.enums.UserStatus;
import com.carrental.common.exception.AppException;
import com.carrental.module.auth.dto.AuthDtos.*;
import com.carrental.module.auth.dto.GoogleLoginRequest;
import com.carrental.module.auth.dto.RegisterRequest;
import com.carrental.module.user.User;
import com.carrental.module.user.UserRepository;
import com.carrental.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
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
import java.util.Collections;
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

    @Value("${google.client-id}")
    private String googleClientId;

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

    // ─── Google Login ─────────────────────────────────────

    @Transactional
    public GoogleAuthResponse loginWithGoogle(GoogleLoginRequest request) {
        // 1. Verify id_token với Google
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(request.getIdToken());
        } catch (Exception e) {
            throw AppException.badRequest("Không thể xác thực Google token");
        }

        if (idToken == null) {
            throw AppException.unauthorized("Google token không hợp lệ hoặc đã hết hạn");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String googleId  = payload.getSubject();
        String email     = payload.getEmail();
        String fullName  = (String) payload.get("name");
        String avatarUrl = (String) payload.get("picture");

        // 2. Tìm user theo googleId hoặc email
        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElse(null);

        if (user == null) {
            // 3a. User mới — cần chọn role
            if (request.getRole() == null) {
                // Chưa có role → yêu cầu frontend hiện modal chọn role
                return GoogleAuthResponse.requireRole();
            }

            // Không cho phép tự đăng ký làm ADMIN
            if (request.getRole() == Role.ADMIN) {
                throw AppException.forbidden("Không thể đăng ký với vai trò Admin");
            }

            // Đã có role → tạo user mới
            user = User.builder()
                    .fullName(fullName != null ? fullName : email)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .googleId(googleId)
                    .avatarUrl(avatarUrl)
                    .role(request.getRole())
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(user);
            log.info("Created new user via Google OAuth: {} (role={})", email, request.getRole());

        } else {
            // 3b. User đã tồn tại — cập nhật googleId / avatar nếu chưa có
            boolean changed = false;
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                changed = true;
            }
            if (avatarUrl != null && user.getAvatarUrl() == null) {
                user.setAvatarUrl(avatarUrl);
                changed = true;
            }
            if (user.getStatus() == UserStatus.LOCKED) {
                throw AppException.forbidden("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
            }
            if (changed) userRepository.save(user);
        }

        // 4. Tạo token hệ thống
        return GoogleAuthResponse.success(buildLoginResponse(user));
    }

    // ─── Helper: build LoginResponse ─────────────────────

    private LoginResponse buildLoginResponse(User user) {
        refreshTokenRepository.revokeAllUserTokens(user);

        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

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