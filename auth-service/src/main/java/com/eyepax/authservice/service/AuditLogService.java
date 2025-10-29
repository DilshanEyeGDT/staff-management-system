package com.eyepax.authservice.service;

import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.repository.AuditLogRepository;
import com.eyepax.authservice.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    // private final UserRepository userRepository; // ✅ Add this

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        // this.userRepository = userRepository;
    }

    @Transactional
    public void record(Long userId, String eventType, String eventDesc, HttpServletRequest request) {
        AuditLog log = new AuditLog();

        // ✅ Fetch the user entity and link it
        // if (userId != null) {
        // userRepository.findById(userId).ifPresent(log::setUser);
        // }
        log.setUserId(userId);
        log.setEventType(eventType);
        log.setEventDesc(eventDesc);
        if (request != null) {
            log.setIpAddress(request.getRemoteAddr());
            log.setUserAgent(request.getHeader("User-Agent"));
        }
        auditLogRepository.save(log);
    }
}