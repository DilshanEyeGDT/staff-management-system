package com.eyepax.authservice.security;

import com.eyepax.authservice.service.AuditLogService;
import com.eyepax.authservice.service.UserSyncService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class AuthenticationSuccessListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private final UserSyncService userSyncService;
    private final AuditLogService auditLogService;

    public AuthenticationSuccessListener(UserSyncService userSyncService, AuditLogService auditLogService) {
        this.userSyncService = userSyncService;
        this.auditLogService = auditLogService;
    }

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        Object principal = event.getAuthentication().getPrincipal();
        if (principal instanceof OidcUser oidcUser) {
            String sub = oidcUser.getClaimAsString("sub");
            String email = oidcUser.getClaimAsString("email");
            String name = oidcUser.getClaimAsString("preferred_username"); // or preferred_username/displayName depending on pool

            // create or update local user
            var user = userSyncService.findOrCreateFromCognito(sub, email, email, name);

            // get current request
            HttpServletRequest request = null;
            try {
                request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
                request.getSession().setAttribute("USER_ID", user.getId());
            } catch (Exception ignored) {}

            // audit
            auditLogService.record(user.getId(), "LOGIN", "Cognito login successful", request);
        }
    }
}