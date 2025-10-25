package com.eyepax.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private Long userId;
    private String eventType;
    private String eventDesc;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
}
