package com.eyepax.authservice.controller;

import com.eyepax.authservice.dto.UserDto;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.service.UserSyncService;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "*") // adjust if needed
public class FlutterUserSyncController {

    private final UserSyncService userSyncService;

    public FlutterUserSyncController(UserSyncService userSyncService) {
        this.userSyncService = userSyncService;
    }

    @PostMapping("/user")
    public ResponseEntity<UserDto> syncUser(@RequestBody UserSyncRequest request) {
        // Create or update user in DB
        User user = userSyncService.findOrCreateFromCognito(
                request.getSub(),
                request.getEmail(),
                request.getUsername(),
                request.getDisplayName());

        // Convert to UserDto
        UserDto dto = new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRoles() != null
                        ? user.getRoles().stream().map(role -> role.getName()).collect(Collectors.toSet())
                        : null);

        return ResponseEntity.ok(dto);
    }

    @Data
    private static class UserSyncRequest {
        private String sub;
        private String email;
        private String username;
        private String displayName;
    }
}
