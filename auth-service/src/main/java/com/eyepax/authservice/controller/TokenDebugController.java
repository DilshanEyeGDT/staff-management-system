package com.eyepax.authservice.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

//dont commit, remove the file after the JWT token validation. this is for testing...

@RestController
public class TokenDebugController {

    @GetMapping("/token-debug")
    public Map<String, Object> tokenDebug(
            @RegisteredOAuth2AuthorizedClient("cognito") OAuth2AuthorizedClient authorizedClient,
            @AuthenticationPrincipal OidcUser oidcUser) {

        String accessToken = authorizedClient.getAccessToken().getTokenValue();
        String idToken = oidcUser.getIdToken().getTokenValue();

        return Map.of(
                "access_token", accessToken,
                "id_token", idToken,
                "user_attributes", oidcUser.getAttributes()
        );
    }
}


