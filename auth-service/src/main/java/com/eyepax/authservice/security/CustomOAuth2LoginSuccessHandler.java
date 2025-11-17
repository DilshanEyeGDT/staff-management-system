package com.eyepax.authservice.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class CustomOAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final String FRONTEND_DASHBOARD_URL = "http://localhost:3000/dashboard";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

        // ✅ Extract OIDC user (must cast to OidcUser for ID token)
        OidcUser oidcUser = (OidcUser) oauthToken.getPrincipal();

        // ✅ ID Token from Cognito
        String idToken = oidcUser.getIdToken().getTokenValue();
        // System.out.println("ID Token (Cognito): " + idToken);

        // URL-safe encoding
        String encodedIdToken = URLEncoder.encode(idToken, StandardCharsets.UTF_8);

        // 🚀 Redirect to React with ONLY id_token
        response.sendRedirect(FRONTEND_DASHBOARD_URL + "?id_token=" + encodedIdToken);
    }
}