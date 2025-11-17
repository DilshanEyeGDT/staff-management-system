package com.eyepax.authservice.security;

import com.eyepax.authservice.model.Role;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.repository.RoleRepository;
import com.eyepax.authservice.repository.UserRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public CustomJwtAuthenticationConverter(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String cognitoSub = jwt.getClaimAsString("sub");
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("email");
        String displayName = jwt.getClaimAsString("preferred_username");

        System.out.println("JWT sub: " + cognitoSub);

        // Find user or create a new one if missing
        User user = userRepository.findByCognitoSub(cognitoSub).orElseGet(() -> {
            System.out.println("🆕 Creating new user in DB for sub: " + cognitoSub);
            User newUser = new User();
            newUser.setCognitoSub(cognitoSub);
            newUser.setEmail(email);
            newUser.setUsername(username);
            newUser.setDisplayName(displayName);
            newUser.setStatus("ACTIVE");
            newUser.setCreatedAt(Instant.now());
            newUser.setLastLogin(Instant.now());

            // Default role: USER
            roleRepository.findByName("USER").ifPresent(role -> {
                Set<Role> roles = new HashSet<>();
                roles.add(role);
                newUser.setRoles(roles);
            });

            return userRepository.save(newUser);
        });

        // Update login timestamps for existing users
        user.setLastLogin(Instant.now());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Convert roles to authorities
        Collection<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());

        return new JwtAuthenticationToken(jwt, authorities, cognitoSub);
    }
}
