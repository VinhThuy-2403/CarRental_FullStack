package com.carrental.module.user;

import com.carrental.common.enums.Role;
import com.carrental.common.exception.AppException;
import com.carrental.module.user.HostRequest.HostRequestStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class HostRequestService {

    private final HostRequestRepository hostRequestRepository;
    private final UserRepository        userRepository;

    // ─── CUSTOMER: Gửi yêu cầu ───────────────────────────

    @Transactional
    public void requestHost(User currentUser) {
        // Chỉ CUSTOMER mới gửi được
        if (currentUser.getRole() != Role.CUSTOMER) {
            throw AppException.badRequest("Bạn đã là Host hoặc Admin, không cần gửi yêu cầu.");
        }

        // Kiểm tra đã có PENDING chưa
        if (hostRequestRepository.existsByUserAndStatus(currentUser, HostRequestStatus.PENDING)) {
            throw AppException.conflict("Bạn đã gửi yêu cầu trở thành Host, vui lòng chờ Admin duyệt.");
        }

        HostRequest request = HostRequest.builder()
                .user(currentUser)
                .status(HostRequestStatus.PENDING)
                .build();

        hostRequestRepository.save(request);
        log.info("User {} requested to become HOST", currentUser.getEmail());
    }

    // ─── CUSTOMER: Xem trạng thái yêu cầu của mình ──────

    public Map<String, Object> getMyRequestStatus(User currentUser) {
        return hostRequestRepository.findTopByUserOrderByRequestedAtDesc(currentUser)
                .map(r -> Map.<String, Object>of(
                        "status",      r.getStatus().name(),
                        "requestedAt", r.getRequestedAt().toString(),
                        "adminNote",   r.getAdminNote() != null ? r.getAdminNote() : ""
                ))
                .orElse(Map.of("status", "NONE"));
    }

    // ─── ADMIN: Lấy danh sách yêu cầu ───────────────────

    public Page<HostRequest> getPendingRequests(int page, int size) {
        return hostRequestRepository.findByStatusOrderByRequestedAtDesc(
                HostRequestStatus.PENDING, PageRequest.of(page, size));
    }

    // ─── ADMIN: Duyệt ────────────────────────────────────

    @Transactional
    public void approve(Long requestId) {
        HostRequest request = hostRequestRepository.findById(requestId)
                .orElseThrow(() -> AppException.notFound("Yêu cầu không tồn tại"));

        if (request.getStatus() != HostRequestStatus.PENDING) {
            throw AppException.badRequest("Yêu cầu này đã được xử lý.");
        }

        User user = request.getUser();
        user.setRole(Role.HOST);
        userRepository.save(user);

        request.setStatus(HostRequestStatus.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        hostRequestRepository.save(request);

        log.info("Admin approved HOST request for user: {}", user.getEmail());
    }

    // ─── ADMIN: Từ chối ──────────────────────────────────

    @Transactional
    public void reject(Long requestId, String adminNote) {
        HostRequest request = hostRequestRepository.findById(requestId)
                .orElseThrow(() -> AppException.notFound("Yêu cầu không tồn tại"));

        if (request.getStatus() != HostRequestStatus.PENDING) {
            throw AppException.badRequest("Yêu cầu này đã được xử lý.");
        }

        request.setStatus(HostRequestStatus.REJECTED);
        request.setAdminNote(adminNote);
        request.setProcessedAt(LocalDateTime.now());
        hostRequestRepository.save(request);

        log.info("Admin rejected HOST request for user: {}", request.getUser().getEmail());
    }
}
