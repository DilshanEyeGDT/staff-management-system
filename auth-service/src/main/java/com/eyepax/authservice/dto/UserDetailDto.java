package com.eyepax.authservice.dto;

import com.eyepax.authservice.model.AuditLog;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class UserDetailDto {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private Set<String> roles;
    private List<AuditLog> auditLogs;

    public UserDetailDto(com.eyepax.authservice.model.User user, List<AuditLog> auditLogs) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.displayName = user.getDisplayName();
        this.roles = user.getRoles().stream().map(r -> r.getName()).collect(java.util.stream.Collectors.toSet());
        this.auditLogs = auditLogs;
    }
}

