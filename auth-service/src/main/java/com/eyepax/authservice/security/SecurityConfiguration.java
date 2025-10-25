package com.eyepax.authservice.security;

import com.eyepax.authservice.repository.UserRepository;
import com.eyepax.authservice.service.AuditLogService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URL;

/**
 * Class to configure AWS Cognito as an OAuth 2.0 authorizer with Spring Security.
 * In this configuration, we specify our OAuth Client.
 * We also declare that all requests must come from an authenticated user.
 * Finally, we configure our logout handler.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Value("${cognito.jwk-set-uri}")
    private String jwkSetUri; // e.g., https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json

    @Bean
    public JwtDecoder jwtDecoder() throws Exception {
        return NimbusJwtDecoder.withJwkSetUri(String.valueOf(new URL(jwkSetUri))).build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           AuditLogService auditLogService,
                                           UserRepository userRepository,
                                           CustomLogoutSuccessHandler customLogoutSuccessHandler,
                                           CustomOAuth2LoginSuccessHandler customOAuth2LoginSuccessHandler) throws Exception {

        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults()) // ✅ enable CORS
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/").permitAll()
                        .anyRequest().authenticated())

                // ✅ OAuth2 login with custom success handler
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(customOAuth2LoginSuccessHandler)
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))

                // ✅ Logout handling (local redirect)
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .addLogoutHandler((request, response, auth) -> {
                            if (auth != null && auth.getName() != null) {
                                System.out.println(">>> Logout handler called for: " + auth.getName());
                            }
                        })
                        .logoutSuccessHandler(customLogoutSuccessHandler)
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .permitAll()
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:3000"); // ✅ your frontend
        configuration.addAllowedMethod("*"); // GET, POST, PATCH, etc.
        configuration.addAllowedHeader("*"); // allow Authorization header
        configuration.setAllowCredentials(true); // allow cookies/auth headers

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
