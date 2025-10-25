package com.eyepax.authservice.repository;

import com.eyepax.authservice.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Find all audit logs for a specific user
    List<AuditLog> findByUserId(Long userId);
}
