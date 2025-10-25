package com.eyepax.authservice.controller;

import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.repository.AuditLogRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/audit-log")
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll();
    }
}
