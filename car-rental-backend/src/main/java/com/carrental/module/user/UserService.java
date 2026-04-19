package com.carrental.module.user;

import com.carrental.common.exception.AppException;
import com.carrental.module.user.dto.UserDtos.*;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    // ─── Get profile ─────────────────────────────────────

    public UserProfileResponse getProfile(User user) {
        return toProfileResponse(user);
    }

    // ─── Update profile ──────────────────────────────────

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request, User user) {
        user.setFullName(request.getFullName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        userRepository.save(user);
        return toProfileResponse(user);
    }

    // ─── Upload avatar ───────────────────────────────────

    @Transactional
    public UserProfileResponse uploadAvatar(MultipartFile file, User user) {
        if (file.isEmpty()) {
            throw AppException.badRequest("File không được để trống");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw AppException.badRequest("Chỉ chấp nhận file ảnh (jpg, png, webp)");
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "carrental/avatars",
                            "public_id", "user_" + user.getId(),
                            "overwrite", true,
                            "resource_type", "image",
                            "transformation", "w_300,h_300,c_fill,g_face"
                    )
            );

            String avatarUrl = (String) uploadResult.get("secure_url");
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            log.info("Uploaded avatar for user {}", user.getId());
            return toProfileResponse(user);

        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw AppException.badRequest("Upload ảnh thất bại. Vui lòng thử lại.");
        }
    }

    // ─── Public host profile ─────────────────────────────

    public PublicHostProfile getPublicHostProfile(Long hostId) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy host"));

        PublicHostProfile profile = new PublicHostProfile();
        profile.setId(host.getId());
        profile.setFullName(host.getFullName());
        profile.setAvatarUrl(host.getAvatarUrl());
        // totalCompletedBookings và avgRating sẽ tính từ BookingRepo/ReviewRepo ở Phase 3+
        profile.setTotalCompletedBookings(0);
        profile.setAvgRating(0.0);
        return profile;
    }

    // ─── Helper ──────────────────────────────────────────

    private UserProfileResponse toProfileResponse(User user) {
        UserProfileResponse res = new UserProfileResponse();
        res.setId(user.getId());
        res.setFullName(user.getFullName());
        res.setEmail(user.getEmail());
        res.setPhone(user.getPhone());
        res.setAvatarUrl(user.getAvatarUrl());
        res.setRole(user.getRole().name());
        res.setAddress(user.getAddress());
        res.setStatus(user.getStatus().name());
        return res;
    }
}