package com.eyepax.authservice.controller;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eyepax.authservice.repository.UserRepository;
import com.eyepax.authservice.service.AuditLogService;
import com.eyepax.authservice.service.UserSyncService;

@RestController
@RequestMapping("/api/sync")
public class AuthSyncController {

    private final UserSyncService userSyncService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    public AuthSyncController(UserSyncService userSyncService,
            AuditLogService auditLogService,
            UserRepository userRepository) {
        this.userSyncService = userSyncService;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<String> syncLogin(@RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {
        try {
            // Decode JWT to get Cognito sub
            String token = authHeader.replace("Bearer ", "");
            Jwt jwt = NimbusJwtDecoder.withJwkSetUri(
                    "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_JTbvLI75U/.well-known/jwks.json")
                    .build().decode(token);
            String sub = jwt.getClaimAsString("sub");
            String email = jwt.getClaimAsString("email");
            String name = jwt.getClaimAsString("preferred_username");

            // create or update user
            var user = userSyncService.findOrCreateFromCognito(sub, email, email, name);

            // audit login
            auditLogService.record(user.getId(), "LOGIN", "Cognito login from Flutter", request);

            return ResponseEntity.ok("Login synced successfully");
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Failed to sync login: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> syncLogout(@RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Jwt jwt = NimbusJwtDecoder.withJwkSetUri(
                    "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_JTbvLI75U/.well-known/jwks.json")
                    .build().decode(token);
            String sub = jwt.getClaimAsString("sub");

            var userId = userRepository.findByCognitoSub(sub)
                    .map(u -> u.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // audit logout
            auditLogService.record(userId, "LOGOUT", "Flutter logout", request);

            return ResponseEntity.ok("Logout synced successfully");
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Failed to sync logout: " + e.getMessage());
        }
    }
}
