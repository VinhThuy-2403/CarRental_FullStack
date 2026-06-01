package com.carrental.module.user;

import com.carrental.module.user.HostRequest.HostRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HostRequestRepository extends JpaRepository<HostRequest, Long> {

    // Kiểm tra user đã có request PENDING chưa
    boolean existsByUserAndStatus(User user, HostRequestStatus status);

    // Lấy request PENDING của user (để hiển thị trạng thái)
    Optional<HostRequest> findTopByUserOrderByRequestedAtDesc(User user);

    // Admin: lấy danh sách theo status
    Page<HostRequest> findByStatusOrderByRequestedAtDesc(HostRequestStatus status, Pageable pageable);
}
