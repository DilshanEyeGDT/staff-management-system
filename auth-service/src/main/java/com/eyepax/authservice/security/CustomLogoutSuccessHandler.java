package com.eyepax.authservice.security;

import com.eyepax.authservice.repository.UserRepository;
import com.eyepax.authservice.service.AuditLogService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Value("${cognito.jwk-set-uri}")
    private String jwkSetUri; // inject JWK URI here

    // ✅ Frontend URL to redirect after logout
    private static final String FRONTEND_LOGIN_URL = "http://localhost:3000/";

    public CustomLogoutSuccessHandler(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public void onLogoutSuccess(HttpServletRequest request,
                                HttpServletResponse response,
                                Authentication authentication)
            throws IOException, ServletException {

        String userId = null;

        if (authentication != null && authentication.getName() != null) {
            // normal session logout
            userId = String.valueOf(userRepository.findByEmail(authentication.getName())
                    .or(() -> userRepository.findByCognitoSub(authentication.getName()))
                    .map(u -> u.getId())
                    .orElse(null));
        } else {
            // logout via token in query param
            String token = request.getParameter("token");
            if (token != null && !token.isEmpty()) {
                try {
                    // decode JWT to get sub
                    Jwt jwt = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build().decode(token);
                    String sub = jwt.getClaimAsString("sub");
                    userId = String.valueOf(userRepository.findByCognitoSub(sub).map(u -> u.getId()).orElse(null));
                } catch (Exception e) {
                    System.out.println(">>> Failed to decode JWT for logout: " + e.getMessage());
                }
            }
        }

        if (userId != null) {
            auditLogService.record(Long.valueOf(userId), "LOGOUT", "User logged out successfully", request);
            System.out.println(">>> Logout audit recorded for user ID: " + userId);
        }

        response.sendRedirect(FRONTEND_LOGIN_URL);
    }
}

