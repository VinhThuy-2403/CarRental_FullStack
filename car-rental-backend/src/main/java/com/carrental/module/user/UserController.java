package com.carrental.module.user;

import com.carrental.common.ApiResponse;
import com.carrental.module.user.dto.UserDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.updateProfile(request, user), "Cập nhật thành công"));
    }

    @PatchMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.uploadAvatar(file, user), "Upload ảnh thành công"));
    }

    @GetMapping("/{id}/public")
    public ResponseEntity<ApiResponse<PublicHostProfile>> getPublicProfile(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getPublicHostProfile(id)));
    }
}