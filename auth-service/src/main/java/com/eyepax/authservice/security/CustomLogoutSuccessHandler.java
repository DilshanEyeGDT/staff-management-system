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

@Component
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Value("${cognito.jwk-set-uri}")
    private String jwkSetUri;

    @Value("${spring.security.oauth2.client.registration.cognito.client-id}")
    private String clientId;

    // ✅ Cognito domain and redirect URL (after logout)
    @Value("${cognito.domain}")
    private String cognitoDomain;

    @Value("${cognito.logout-redirect-uri}")
    private String logoutRedirectUri;

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
            // ✅ Normal logout (user is authenticated in session)
            userId = String.valueOf(userRepository.findByEmail(authentication.getName())
                    .or(() -> userRepository.findByCognitoSub(authentication.getName()))
                    .map(u -> u.getId())
                    .orElse(null));
        } else {
            // ✅ Logout via token in query param
            String token = request.getParameter("token");
            if (token != null && !token.isEmpty()) {
                try {
                    Jwt jwt = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build().decode(token);
                    String sub = jwt.getClaimAsString("sub");
                    userId = String.valueOf(userRepository.findByCognitoSub(sub)
                            .map(u -> u.getId())
                            .orElse(null));
                } catch (Exception e) {
                    System.out.println("⚠️ Failed to decode JWT for logout: " + e.getMessage());
                }
            }
        }

        if (userId != null) {
            auditLogService.record(Long.valueOf(userId), "LOGOUT", "User logged out successfully", request);
            System.out.println("✅ Logout audit recorded for user ID: " + userId);
        }

        // ✅ Redirect to Cognito logout (clear hosted UI session)
        String cognitoLogoutUrl = String.format(
                "https://%s/logout?client_id=%s&logout_uri=%s",
                cognitoDomain, clientId, logoutRedirectUri);

        System.out.println("🔁 Redirecting to Cognito logout: " + cognitoLogoutUrl);
        response.sendRedirect(cognitoLogoutUrl);
    }
}
