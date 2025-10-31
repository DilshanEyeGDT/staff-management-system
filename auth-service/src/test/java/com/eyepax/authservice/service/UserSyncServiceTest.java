package com.eyepax.authservice.service;

import com.eyepax.authservice.model.Role;
import com.eyepax.authservice.model.User;
import com.eyepax.authservice.repository.RoleRepository;
import com.eyepax.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserSyncServiceTest {

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private UserSyncService userSyncService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        roleRepository = mock(RoleRepository.class);
        userSyncService = new UserSyncService(userRepository, roleRepository);
    }

    @Test
    void testFindOrCreateFromCognito_ExistingUser_UpdatesFields() {
        String cognitoSub = "abc123";
        User existingUser = new User();
        existingUser.setCognitoSub(cognitoSub);
        existingUser.setEmail("old@example.com");
        existingUser.setUsername("olduser");
        existingUser.setDisplayName("Old Name");
        existingUser.setRoles(new HashSet<>());

        when(userRepository.findByCognitoSub(cognitoSub)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String newEmail = "new@example.com";
        String newDisplayName = "New Name";

        User result = userSyncService.findOrCreateFromCognito(cognitoSub, newEmail, "olduser", newDisplayName);

        assertEquals(newEmail, result.getEmail());
        assertEquals(newDisplayName, result.getDisplayName());
        assertEquals("olduser", result.getUsername());
        assertNotNull(result.getLastLogin());
        assertNotNull(result.getUpdatedAt());

        verify(userRepository, times(1)).save(existingUser);
    }

    @Test
    void testFindOrCreateFromCognito_NewUser_CreatesWithDefaultRole() {
        String cognitoSub = "newuser123";
        String email = "test@example.com";
        String username = "testuser";
        String displayName = "Test User";

        when(userRepository.findByCognitoSub(cognitoSub)).thenReturn(Optional.empty());

        Role userRole = new Role();
        userRole.setId(1L);
        userRole.setName("USER");

        when(roleRepository.findByName("USER")).thenReturn(Optional.of(userRole));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userSyncService.findOrCreateFromCognito(cognitoSub, email, username, displayName);

        assertEquals(cognitoSub, result.getCognitoSub());
        assertEquals(email, result.getEmail());
        assertEquals(username, result.getUsername());
        assertEquals(displayName, result.getDisplayName());
        assertEquals("ACTIVE", result.getStatus());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getLastLogin());
        assertTrue(result.getRoles().stream().anyMatch(r -> r.getName().equals("USER")));

        verify(userRepository, times(1)).save(result);
    }

    @Test
    void testFindOrCreateFromCognito_NewUser_NoDefaultRole() {
        String cognitoSub = "newuser456";
        String email = "noRole@example.com";
        String username = "noroleuser";
        String displayName = "No Role User";

        when(userRepository.findByCognitoSub(cognitoSub)).thenReturn(Optional.empty());
        when(roleRepository.findByName("USER")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userSyncService.findOrCreateFromCognito(cognitoSub, email, username, displayName);

        assertEquals(cognitoSub, result.getCognitoSub());
        assertEquals(email, result.getEmail());
        assertEquals(username, result.getUsername());
        assertEquals(displayName, result.getDisplayName());
        assertEquals("ACTIVE", result.getStatus());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getLastLogin());
        assertTrue(result.getRoles().isEmpty());

        verify(userRepository, times(1)).save(result);
    }
}
