package com.eyepax.authservice.service;

import com.eyepax.authservice.model.Role;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.repository.RoleRepository;
import com.eyepax.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class UserSyncService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserSyncService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public User findOrCreateFromCognito(String cognitoSub, String email, String username, String displayName) {
        Optional<User> existing = userRepository.findByCognitoSub(cognitoSub);
        if (existing.isPresent()) {
            User u = existing.get();
            u.setLastLogin(Instant.now());
            // optionally update display name/email if changed
            if (displayName != null) u.setDisplayName(displayName);
            if (email != null) u.setEmail(email);
            u.setUpdatedAt(Instant.now());
            return userRepository.save(u);
        }
        // create user
        User u = new User();
        u.setCognitoSub(cognitoSub);
        u.setEmail(email);
        u.setUsername(username);
        u.setDisplayName(displayName);
        u.setStatus("ACTIVE");
        u.setCreatedAt(Instant.now());
        u.setLastLogin(Instant.now());

        // default role: USER (optional)
        roleRepository.findByName("USER").ifPresent(role -> {
            Set<Role> roles = new HashSet<>();
            roles.add(role);
            u.setRoles(roles);
        });

        return userRepository.save(u);
    }
}