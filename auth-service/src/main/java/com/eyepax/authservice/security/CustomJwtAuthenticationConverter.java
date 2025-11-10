package com.eyepax.authservice.security;

import com.eyepax.authservice.model.User;
import com.eyepax.authservice.repository.UserRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.stream.Collectors;

@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;

    public CustomJwtAuthenticationConverter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String cognitoSub = jwt.getClaimAsString("sub");
        System.out.println("JWT sub: " + cognitoSub);

        // Load user from DB
        User user = userRepository.findByCognitoSub(cognitoSub)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        System.out.println("User roles: " + user.getRoles());

        // Map DB roles to authorities
        Collection<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName())) // or prefix with ROLE_ if using hasRole
                .collect(Collectors.toList());

        return new JwtAuthenticationToken(jwt, authorities, cognitoSub);
    }
}
