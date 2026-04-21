package com.carrental.module.user;

import com.carrental.common.enums.Role;
import com.carrental.common.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetPasswordToken(String token);

    // ── Admin queries ────────────────────────────────────

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
        AND (:status IS NULL OR u.status = :status)
        AND (:keyword IS NULL OR
             LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
             LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY u.createdAt DESC
        """)
    Page<User> findAllWithFilter(
            @Param("role")    Role role,
            @Param("status")  UserStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByRole(Role role);

    long countByStatus(UserStatus status);
}