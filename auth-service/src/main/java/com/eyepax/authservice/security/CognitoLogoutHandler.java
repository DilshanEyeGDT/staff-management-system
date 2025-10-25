//package com.eyepax.authservice.security;
//
//import com.eyepax.authservice.repository.UserRepository;
//import com.eyepax.authservice.service.AuditLogService;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.web.authentication.logout.SimpleUrlLogoutSuccessHandler;
//import org.springframework.web.util.UriComponentsBuilder;
//
//import java.net.URI;
//import java.nio.charset.StandardCharsets;
//import java.util.Optional;
//
//public class CognitoLogoutHandler extends SimpleUrlLogoutSuccessHandler {
//
//    private final AuditLogService auditLogService;
//    private final UserRepository userRepository;
//
//    public CognitoLogoutHandler(AuditLogService auditLogService, UserRepository userRepository) {
//        this.auditLogService = auditLogService;
//        this.userRepository = userRepository;
//    }
//
//    private String domain = "https://ap-southeast-2jtbvli75u.auth.ap-southeast-2.amazoncognito.com";
//    private String logoutRedirectUrl = "http://localhost:8080";
//    private String userPoolClientId = "2vkd66pts7u65lmjoodml0b3nc";
//
//    @Override
//    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
//
//        System.out.println(">>> CognitoLogoutHandler triggered for user: " + (authentication != null ? authentication.getName() : "null"));
//
//        // write logout audit before redirect
//        if (authentication != null) {
//            String cognitoSub = authentication.getName(); // principal is actually Cognito "sub" (UUID)
//            Optional.of(cognitoSub)
//                    .flatMap(userRepository::findByCognitoSub)
//                    .ifPresent(u -> {
//                        auditLogService.record(u.getId(), "LOGOUT", "User logged out", request);
//                        System.out.println(">>> Logout audit recorded for " + u.getEmail());
//                    });
//
//        }
//
//        return UriComponentsBuilder
//                .fromUri(URI.create(domain + "/logout"))
//                .queryParam("client_id", userPoolClientId)
//                .queryParam("logout_uri", logoutRedirectUrl)
//                .encode(StandardCharsets.UTF_8)
//                .build()
//                .toUriString();
//    }
//}
