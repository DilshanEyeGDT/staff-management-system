package com.eyepax.authservice.service;

import com.eyepax.authservice.dto.UpdateUserDto;
import com.eyepax.authservice.dto.UserDetailDto;
import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.model.AuditLog;
import com.eyepax.authservice.model.Role;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.repository.AuditLogRepository;
import com.eyepax.authservice.repository.RoleRepository;
import com.eyepax.authservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       AuditLogRepository auditLogRepository,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
    }

    public UserDto getCurrentUser(Authentication authentication) {
        String cognitoSub = authentication.getName();
        User user = getUserByCognitoSub(cognitoSub);

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setRoles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()));
        return dto;
    }

    public UserDto updateCurrentUser(Authentication authentication, UpdateUserDto updateDto) {
        String cognitoSub = authentication.getName();
        User user = userRepository.findByCognitoSub(cognitoSub)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateDto.getDisplayName() != null) user.setDisplayName(updateDto.getDisplayName());
        if (updateDto.getUsername() != null) user.setUsername(updateDto.getUsername());

        user = userRepository.save(user);

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setRoles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()));
        return dto;
    }

    // List users with pagination and optional search
    public Page<UserDto> getUsers(int page, int size, String query) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = query == null || query.isBlank()
                ? userRepository.findAll(pageable)
                : userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable);

        return users.map(u -> {
            UserDto dto = new UserDto();
            dto.setId(u.getId());
            dto.setUsername(u.getUsername());
            dto.setEmail(u.getEmail());
            dto.setDisplayName(u.getDisplayName());
            dto.setRoles(u.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()));
            return dto;
        });
    }

    // Fetch single user + audit logs
    public UserDetailDto getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<AuditLog> logs = auditLogRepository.findByUserId(userId);
        return new UserDetailDto(user, logs);
    }

    // Update roles
    public UserDetailDto updateUserRoles(Long userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Clear current roles and assign new roles
        user.getRoles().clear();
        roleNames.forEach(name -> {
            Role role = roleRepository.findByName(name)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + name));
            user.getRoles().add(role);
        });
        userRepository.save(user);

        // Record audit log
        auditLogService.record(user.getId(), "ROLE_UPDATE", "Roles updated: " + roleNames, null);

        return getUserDetails(userId);
    }

    // inside UserService.java
    public User getUserByCognitoSub(String cognitoSub) {
        return userRepository.findByCognitoSub(cognitoSub)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}

